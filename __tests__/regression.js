// mocha test script
// finds all the instui component directories and
// generates a test for each corresponding component in the docs app
const assert = require('chai').assert
const fs = require('fs')
const path = require('path')
const Spiffy = require('../Spiffy')



const options = {
  errorThreshold: 0,
  getViewportFunc: function () {
    return {
      width: document.documentElement.clientWidth,
      height: document.getElementById('main').scrollHeight,
      deviceScaleFactor: window.devicePixelRatio
    }
  }
}
const ref = 'http://instructure.github.io/instructure-ui/'
const tst = 'http://0.0.0.0:8001/'
const out = './__tests__/__screenshots__/'
const component = ''

describe('regression', () => {
  const componentsDir = path.resolve(__dirname, '../../instructure-ui/packages/ui-core/src/components')

  fs.readdirSync(componentsDir).forEach((c) => {
    genericTest(c)()
  })
})


function genericTest (cname) {
  const outdir = path.resolve(out, cname || 'home')
  return function (sniffy) {
    it(`${cname} renders correctly`, async () => {
      const spiffy = new Spiffy(`${ref}#${cname}`, `${tst}#${cname}`, outdir, options)
      const result = await spiffy.test()
      assert(result == true, result)
    })
  }
}