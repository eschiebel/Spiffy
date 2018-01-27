const minimist = require('minimist');
const path = require('path');
const Spiffy = require('./Spiffy');

const args = minimist(process.argv.slice(2));


if(args.help || args['?']) Usage();
let refUrl = args.refUrl || Usage('refUrl is required');
let tstUrl = args.tstUrl || Usage('tstUrl is required');
const outdir = args.outdir || Usage('outdir is required');
const headless = !!args.headless

if (!/^https?:/.test(refUrl)) {
  refUrl = `file://${path.resolve(refUrl)}`;
}
if (!/^https?:/.test(tstUrl)) {
  tstUrl = `file://${path.resolve(tstUrl)}`
}

const spiffy = new Spiffy({
  refUrl: refUrl,
  tstUrl: tstUrl,
  tstoutdir: outdir,
  headless: headless
})

go().then(result => {
  process.stdout.write(result.toString())
}).catch(err => {
  process.stderr.write(err.toString())
});


async function go () {
  let result = 'not yet';
  try {
    result = await spiffy.test();
  } catch (err) {
    result = err;
  }
  return result;
}

function Usage(errmsg) {
  if (errmsg) {
    console.error(errmsg);
  }
  console.log(`Usage:
    node test-one.js --refUrl=<url to reference page> --tstUrl=<url to test page> --outdir=<output dir> --headless
  `);
  process.exit(0);
}
