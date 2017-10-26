# This is an experiment

assumes repo dir `reg` is adjacent to `instructure-ui 4.x`

From the reg directory

```sh
node regress.js --ref=http://instructure.github.io/instructure-ui/ --tst=http://0.0.0.0:8001/ Alert
```

then look in the `reg/__tests__/__screenshots__/Alert` directory

Or try
```sh
yarn run mtest
```
which will test all the components it can find (you will have to rename `__tests__\regression.js-save` to `regression.js`)

Or (afer renaming `regression.js`), use jest

```sh
yarn run test:update
```
then
```sh
yarn run test
```
but that hangs somewhere in puppeteer, and I don't know why.
