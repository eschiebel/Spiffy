#!/bin/bash
USAGE='regress.sh --ref refurl --tst tsturl --out outdir componentName'

componentName=''
tstUrl=''
refUrl=''
outdir='__tests__/__screenshots__'
headless=1

while [[ $# -gt 0 ]]
do
  key="$1"

  case $key in
    --ref)
      refUrl="$2"
      shift
      shift
      ;;
    --tst)
      tstUrl="$2"
      shift
      shift
      ;;
    --threshold)
      threshold=$2
      shift
      shift
      ;;
    --out)
      outdir="$2"
      shift
      shift
      ;;
    --headful)
      headless=0
      shift
      ;;
    --?|--help|--h)
      echo $USAGE
      exit 0
      ;;
      *)
      componentName="$1"
      shift
  esac
done

# echo tstUrl=$tstUrl
# echo refUrl=$refUrl
# echo outdir=$outdir
# echo comp=$componentName

componentName=$componentName tstUrl=$tstUrl refUrl=$refUrl out=$outdir headless=$headless node ./node_modules/.bin/mocha --slow 10s --timeout 200s __tests__/regression.js
