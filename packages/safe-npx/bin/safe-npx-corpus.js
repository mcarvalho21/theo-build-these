#!/usr/bin/env node
import { evaluateRiskCorpus, renderRiskCorpusEvaluation } from '../src/risk-corpus.js';

const json = process.argv.includes('--json');
const evaluation = evaluateRiskCorpus();
if (json) console.log(JSON.stringify(evaluation, null, 2));
else console.log(renderRiskCorpusEvaluation(evaluation));
process.exit(evaluation.summary.missed === 0 ? 0 : 3);
