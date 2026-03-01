const { updateJSONFile } = require('./dbFunction');
const path = require('path');

const DATASETS_PATH = process.env.DATASETS_PATH || "../data/datasets";
const dbPath = path.join(DATASETS_PATH, "home.json");

// Example: pass data via command line or hardcode for testing
const obj = process.argv[2] ? JSON.parse(process.argv[2]) : { nodes: [], links: [] };

console.log(updateJSONFile(obj, dbPath));