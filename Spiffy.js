const debug = require('debug')('spiffy')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const PNG = require('pngjs').PNG
const pixelmatch = require('pixelmatch')
const puppeteer = require('puppeteer')

class Spiffy {
  // @param options:
  //  refUrl: url to the reference page - required
  //  tstUrl: url to the page we're testing - required
  //  tstoutdir: path to directory where the results are written
  //  errorThreshold: percent different to be considered a failure (default = 0)
  //  getViewportFunc: function returning {width, height, deviceScaleFactor} of the viewport we're capturing
  //  helperFunc: function to manipulae the page before taking the screenshot
  constructor (options) {
    this.ref = options.refUrl
    this.tst = options.tstUrl
    this.tstout = options.tstoutdir
    this.refout = options.refoutdir || this.tstout || '/tmp/spiffy'
    this.errorThreshold = options.errorThreshold || 0
    this.getViewportFunc = options.getViewportFunc
    this.helperFunc = options.helperFunc
    this.update = !!options.refUrl
    this.headless = 'headless' in options ? !!options.headless : true

    this.refFilepath = path.resolve(this.refout, 'regression.snapshot.png')
    this.tstFilepath = path.resolve(this.tstout, 'tst.png')
    this.diffFilepath = path.resolve(this.tstout, 'diff.png')

    if (!fs.existsSync(this.tstout)) {
      mkdirp.sync(path.resolve(__dirname, this.tstout))
    }
    if (!fs.existsSync(this.refout)) {
      mkdirp.sync(path.resolve(__dirname, this.refout))
    }
  }

  // The test driver.
  // resolves the returned promise if the screen captures match w/in the given threshold (default 0)
  // rejects the returned promise with a useful message if not
  async test () {
    return new Promise(async (resolve, reject) => {
      try {
        const updateOnly = this.update && !this.tst

        // capture the web page(s)
        const refScreen = await this.findRef(this.ref, this.refFilepath)
        if (updateOnly) {
          debug('update only')
          resolve(true)
        } else {
          const tstScreen = await this.capture(this.tst)
          writePNG(tstScreen, this.tstFilepath)
          debug('capture done')

          // compute the difference
          const {png, stats} = this.diff(refScreen, tstScreen)

          // save the diff image
          writePNG(png, this.diffFilepath)

          // how'd we do?
          debug(stats.percentage, ' > ', this.errorThreshold, '?')
          if (stats.percentage > this.errorThreshold) {
            const pct = Math.round(stats.percentage * 10000) / 10000
            const failMessage = `${pct}% different, open ${this.diffFilepath}`
            debug('failed test, rejecting')
            reject(new Error(failMessage))
          } else {
            debug('resolving')
            resolve(true)
          }
        }
      } catch (err) {
        debug('rejecting test')
        reject(err)
      }
    })
  }

  async findRef (url, capturePath) {
    debug('findRef')
    let refImg
    if (url) {
      refImg = await this.capture(url)
      writePNG(refImg, this.refFilepath)
    } else {
      // look for it on disk
      if (fs.existsSync(capturePath)) {
        refImg = readPNG(capturePath)
      } else {
        throw new Error(`Cannot find reference image '${capturePath}'`)
      }
    }
    return refImg
  }
  // capture a screnshot of the given URL and save it in the file <name>.png
  // @param url: URL to the page we're capturing
  // @returns the screen capture png image
  async capture (url) {
    debug('capture', url)
    const browser = await puppeteer.launch({ headless: this.headless })
    debug('got browser')
    const page = await browser.newPage()
    debug('got page')
    await page.goto(url)
    debug('got ', url)

    // make sure we grab the whole page (with some outside help)
    if (this.getViewportFunc) {
      const dimensions = await page.evaluate(this.getViewportFunc)
      debug('dimensions:', dimensions)
      page.setViewport(dimensions)
      debug('set viewport')
    }

    if (this.helperFunc) {
      debug('calling helperFunc')
      await this.helperFunc(page)
      debug('returned from helperFunc')
    }
    // Note: while page.screenshot() can save the image itself, the png data I get
    // when reading the file is different, so I can't compare to a later capture.
    // When we use pngjs to both write and read, the diff works correctly
    const screenshot = await page.screenshot()
    debug('got screenshot')

    await browser.close()
    debug('browser closed')

    // convert raw data to a png image structure
    return rawToPng(screenshot)
  }

  // does the actual image diffing work
  // @param imgA: first png image
  // @param imgB: second png image
  // @returns object with diff stats and the difference png image
  diff (imgA, imgB) {
    debug('diff...')
    // all 3 images must be the same size, so take the smallest size
    // (though they should be the same)
    const w = Math.min(imgA.width, imgB.width)
    const h = Math.min(imgA.height, imgB.height)
    // create the png for putting the diff image
    const diff = new PNG({width: w, height: h})
    // initialize the statistics
    const stats = {
      total: w * h,
      differences: 0
    }

    // compute difference image and get number of different pixels
    stats.differences = pixelmatch(imgA.data, imgB.data, diff.data, w, h, {threshold: 0})

    // different pixels as a percent of the total
    stats.percentage = (stats.differences / stats.total) * 100

    return {png: diff, stats}
  }

}

// ----------- helpers ---------------

// convert raw image data into a png image
function rawToPng (data) {
  return PNG.sync.read(data, {
    filterType: 4
  })
}

// read a png image from disk and return it
function readPNG (path) {
  debug('readPNG', path)
  const data = fs.readFileSync(path)
  const png = rawToPng(data)
  return png
}

// write a png image to disk at the given path
function writePNG (png, path) {
  debug('writePNG', path)
  const buffer = PNG.sync.write(png)
  debug('writing got buffer')
  fs.writeFileSync(path, buffer)
  debug('writePNG done')
}


module.exports = Spiffy
