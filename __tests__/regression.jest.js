// jest test script.
// for some reason hangs at the screenshot when not running jest -u
import puppeteer from 'puppeteer'
import {toMatchImageSnapshot} from 'jest-image-snapshot'

expect.extend({toMatchImageSnapshot})

const config = { threshold: 0 }
const ref = 'http://instructure.github.io/instructure-ui/'
const tst = 'http://0.0.0.0:8001/'
const url = tst
describe('regression', () => {
  it('renders correctly', async () => {
    const browser = await puppeteer.launch({ headless: false });
    console.log('got browser')

    debugger

    const page = await browser.newPage();
    console.log('got page')
    await page.goto(url);
    console.log('got ', url)
    const dimensions = await page.evaluate(() => {
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight, //document.getElementById('main').scrollHeight,
        deviceScaleFactor: window.devicePixelRatio
      }
    })
    console.log('dimensions:', dimensions)
    page.setViewport(dimensions)
    console.log('set viewport')

    const screenshot = await page.screenshot();
    console.log('got screenshot')
    // console.log('goonna regret this', screenshot)

    expect(screenshot).toMatchSnapshot({
      customDiffConfig: config
    })
    console.log('toMatched')
    await browser.close()
    console.log('browser closed')
    console.log('fini')
  })
})
