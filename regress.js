const path = require('path')
const rimraf = require('rimraf')
const argv = require('minimist')(process.argv.slice(2))
const Spiffy = require('./Spiffy')

const ref = argv.ref || Usage()
const tst = argv.tst || Usage()
const out = argv.out || './__tests__/__screenshots__/'
const thresh = argv.threshold || 0
const component = argv._[0] || ''
const help = argv['?'] || false

if (help) {
  Usage()
}

function Usage () {
  console.log('Usage:')
  console.log(`node ${process.argv[1]} --ref=<url to reference> --tst=<url to test> [--out=<output dir> --threshold=<percent threshold to be considered different>] componentName`)
  process.exit(1)
}

async function go () {
  try {
    const outdir = path.resolve(out, component || 'home')
    rimraf.sync(outdir)

    // get the size of the desired browser viewport for the instui docs app
    const getDocsAppViewport = function () {
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight, //document.getElementById('main').scrollHeight,
        deviceScaleFactor: window.devicePixelRatio
      }
    }
    const options = {
      getViewportFunc: getDocsAppViewport
    }
    const spiffy = new Spiffy(`${ref}#${component}`, `${tst}#${component}`, outdir, options)
    await spiffy.test()
    console.log('>>> success!')
  } catch (ex) {
    console.error('>>> fail:', ex.message || ex)
    process.exit(2)
  }
  process.exit(0)
}
go()
