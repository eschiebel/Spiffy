const debug = require('debug')('spiffy')
const fs = require('fs')
const path = require('path')
const PNG = require('pngjs').PNG
const pixelmatch = require('pixelmatch')
const puppeteer = require('puppeteer')

class Spiffy {
  // @param refUrl: url to the reference page
  // @param tstUrl: url to the page we're testing
  // @param outpath: path to directory where the results are written
  // @param options:
  //        errorThreshold: percent different to be considered a failure (default = 0)
  //        getViewportFunc: function returning {width, height, deviceScaleFactor} of the viewport we're capturing
  constructor (options) {
    this.ref = options.refUrl
    this.tst = options.tstUrl
    this.out = options.outpath
    this.diffFilepath = path.resolve(this.out, 'diff.png')
    this.errorThreshold = options.threshold || 0
    this.getViewportFunc = options.getViewportFunc
    this.update = !!options.refUrl
    this.headless = 'headless' in options ? !!options.headless : true

    if (!fs.existsSync(this.out)) {
      fs.mkdirSync(path.resolve(__dirname, this.out))
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
        let refScreen = await this.findRef(this.ref, path.resolve(this.out, 'ref.png'))
        writePNG(refScreen, path.resolve(this.out, 'ref.png'))
        if( updateOnly ) {
          debug('update only')
          resolve(true)
        } else {
          let tstScreen = await this.capture(this.tst)
          writePNG(tstScreen, path.resolve(this.out, 'tst.png'))
          debug('capture done')

          // compute the difference
          const {png, stats} = this.diff(refScreen, tstScreen)

          // save the diff image
          writePNG(png, this.diffFilepath)

          // how'd we do?
          debug(stats.percentage, ' > ', this.errorThreshold, '?')
          if (stats.percentage > this.errorThreshold) {
            const pct = Math.round(stats.percentage * 10000) / 10000 + '%'
            const failMessage = `${pct} different, open ${this.diffFilepath}`
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
    let refImg
    if(url) {
      refImg = await this.capture(url)
    } else {
      // look for it on disk
      if (fs.existsSync(capturePath)) {
        refImg = readPNG (capturePath)
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
    const browser = await puppeteer.launch({ headless: this.headless });
    debug('got browser')
    const page = await browser.newPage();
    debug('got page')
    await page.goto(url);
    debug('got ', url)

    // make sure we grab the whole page (with some outside help)
    if (this.getViewportFunc) {
      const dimensions = await page.evaluate(this.getViewportFunc)
      debug('dimensions:', dimensions)
      page.setViewport(dimensions)
      debug('set viewport')
    }
    // Note: while page.screenshot() can save the image itself, the png data I get
    // when reading the file is different, so I can't compare to a later capture.
    // When we use pngjs to both write and read, the diff works correctly
    const screenshot = await page.screenshot();
    debug('got screenshot')

    await browser.close()
    debug('browser closed')

    // convert raw data to a png image structure
    return rawToPng(screenshot)
  }

  // diffFromFile (pathA, pathB, pathDiff) {
  //   debug('diffFromFile...')
  //
  //   const imgA = readPNG(pathA)
  //   const imgB = readPNG(pathB)
  //   debug('finished loading imgs')
  //
  //   this.diff(imgA, imgB, pathDiff)
  // }


  // does the actual image diffing work
  // @param imgA: first png image
  // @param imgB: second png image
  // @returns object with diff stats and the difference png image
  diff (imgA, imgB) {
    debug('diffImg...')
    // all 3 images must be the same size, so take the smallest size
    // (though they should be the same)
    const w = Math.min(imgA.width, imgB.width)
    const h = Math.min(imgA.height, imgB.height)
    // create the png for putting the diff image
    const diff = new PNG({width: w, height: h});
    // initialize the statistics
    const stats = {
      total: w * h,
      differences: 0
    }

    // compute difference image and get number of different pixels
    stats.differences = pixelmatch(imgA.data, imgB.data, diff.data, w, h, {threshold: 0})

    // different pixels as a percent of the total
    stats.percentage = stats.differences / stats.total * 100

    return {png: diff, stats}
  }

}

//----------- helpers ---------------

// convert raw image data into a png image
function rawToPng (data) {
  return PNG.sync.read(data, {
    filterType: 4
  })
}

// read a png image from disk and return it
function readPNG (path) {
  debug('reading', path)
  const data = fs.readFileSync(path)
  const png = rawToPng(data)
  return png
}

// write a png image to disk at the given path
function writePNG (png, path) {
  debug('writPNG...', path)
  const buffer = PNG.sync.write(png)
  debug('writing got buffer')
  fs.writeFileSync(path, buffer)
  debug('write done')
}


module.exports = Spiffy
