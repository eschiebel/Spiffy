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
const ref = process.env.refUrl // 'http://instructure.github.io/instructure-ui/'
const tst = process.env.tstUrl // 'http://0.0.0.0:8001/'
const out = process.env.outDir || './__tests__/__screenshots__/'
const componentsDir = path.resolve(__dirname, '../../instructure-ui/packages/ui-core/src/components')
const component = process.env.componentName
const update = !!ref

describe('regression', () => {
  if (!component) {
    fs.readdirSync(componentsDir).forEach((c) => {
      genericTest(c)()
    })
  } else {
    genericTest(component)()
  }
})

function genericTest (cname) {
  const outpath = path.resolve(out, cname || 'home')
  return function () {
    it(`${cname} renders correctly`, async () => {
      let opts = Object.assign({}, options, {outpath: outpath})

      opts.refUrl = ref ? `${ref}#${cname}` : null
      opts.tstUrl = tst ? `${tst}#${cname}` : null
      const spiffy = new Spiffy(opts)

      const result = await spiffy.test()
      assert(result == true, result)
    })
  }
}
