const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const Spiffy = require('./Spiffy')

const ref = argv.ref
const tst = argv.tst
if (!(tst || ref)) {
  Usage()
}
const out = argv.out || './__tests__/__screenshots__/'
const thresh = argv.thresh || 0
const component = argv._[0] || ''
const help = argv['?'] || argv['help'] || false

if (help) {
  Usage()
}

function Usage () {
  console.log(`Usage:
  node ${process.argv[1]} [--ref=<url>] [--tst=<url>] [--out=<output dir>] [--threshold=<percent>] componentName
  Options:
    --ref: url to capture reference screenshot.
           If omitted, look in the output directory for ref.png.
           If provided, will save ref.png in the output directory
    --tst: url to capture the screenshot we're comparing to the reference
           If omitted, --ref is required
    --out: output directory. Saved screenshots are saved in a <componentName> subdirectory that will be
            created under the output directory
            default = './__tests__/__screenshots__'
    --thesh: the percentage difference between the pixels in ref.png and tst.png before they are considered different.
            default=0
    compnentName: the component we're testing. '#<componentName>' is appended to the ref and tst URLs for loading
          the component's pages
    --?,--help: this message
  `)
  process.exit(1)
}

async function go () {
  try {
    const outpath = path.resolve(out, component || 'home')

    // get the size of the desired browser viewport for the instui docs app
    const getDocsAppViewport = function () {
      return {
        width: document.documentElement.clientWidth,
        height: document.getElementById('main').scrollHeight,
        deviceScaleFactor: window.devicePixelRatio
      }
    }
    const options = {
      getViewportFunc: getDocsAppViewport
    }
    const spiffy = new Spiffy(Object.assign({}, options, {
      refUrl: ref ? `${ref}#${component}` : null,
      tstUrl: tst ? `${tst}#${component}` : null,
      outpath
    }))
    await spiffy.test()
    console.log('>>> success!')
  } catch (ex) {
    console.error('>>> fail:', ex.message || ex)
    process.exit(2)
  }
  process.exit(0)
}
go()
