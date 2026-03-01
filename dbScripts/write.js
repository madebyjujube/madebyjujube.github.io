const { writeDb } = require('./dbFunction');
const path = require('path');

const DATASETS_PATH = process.env.DATASETS_PATH || "../datasets";
const dbPath = path.join(DATASETS_PATH, "home.json");

// Example usage - modify as needed
const obj = {
  id: "test-node",
  source: "test-node",
  target: "meowwww",
  value: 5
};

console.log(writeDb(obj, dbPath));