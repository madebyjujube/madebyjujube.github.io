const fs = require('fs');

function readDb(dbName = 'db.json') {
    const data = fs.readFileSync(dbName, 'utf8');
    return JSON.parse(data);
}

function writeDb(obj, dbName = 'db.json') {
    if (!obj) {
        return console.log('database not found')
    }
    try {
        fs.writeFileSync(dbName, JSON.stringify(obj));
    }
    catch (err) {
        console.log('save failed, ' + err);
    }
}

module.exports = {readDb, writeDb};