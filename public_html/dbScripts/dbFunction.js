const fs = require('fs');

function readDb(dbName = 'db.json') {
    const data = fs.readFileSync(dbName, 'utf8');
    return JSON.parse(data);
}

// Credits to Sabine: wrote this function that appends to the JSON file :-)
function writeDb(obj, dbName = 'db.json') {
    if (!obj) {
        return console.log('database not found')
    }
    try {
        //check if file is empty ;0
        //if file is empty - make an empty arr and write
        if(fs.readFileSync(dbName, 'utf8').length ===0){
          let arr = [];
          arr.push(obj);
          fs.writeFileSync(dbName,JSON.stringify(arr ));
        }
        //have data already in the file
        //read in entire array and then out...
        else
        {
        // read the data
        let _data = fs.readFileSync(dbName, 'utf8');
        //parse as ab array
        let asArray = JSON.parse(_data)
        // add the new data
        asArray.push(obj);
        //write out
        fs.writeFileSync(dbName,JSON.stringify(asArray));
        }
 
    }
    catch (err) {
        console.log('save failed, ' + err);
    }
}

module.exports = {readDb, writeDb};

