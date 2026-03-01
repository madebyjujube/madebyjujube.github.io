const { readDb } = require('./dbFunction');
const path = require('path');

const DATASETS_PATH = process.env.DATASETS_PATH || "../datasets";
const dbPath = process.argv[2] 
  ? path.join(DATASETS_PATH, `${process.argv[2]}.json`)  // node read.js username
  : path.join(DATASETS_PATH, "home.json");               // default: home

console.log(readDb(dbPath));