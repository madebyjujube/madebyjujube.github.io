const fs = require('fs')

function readDb(dbName = './public_html/datasets/ono.json') {
    const data = fs.readFileSync(dbName, 'utf8')
    return JSON.parse(data)
}

// Credits to Sabine: provided this function that appends to the JSON file :-)
function writeDb(obj, dbName = 'user-data.json') {
    if (!obj) {
        return console.log('oops', 'database not found')
    }
    try {
        //check if file is empty 0
        //if file is empty - make an empty arr and write
        if(fs.readFileSync(dbName, 'utf8').length ===0){
            let arr = []
            arr.push(obj)
            //   ***problem reading when pushed as array, i need JSON file to start with {}, not []...***
            fs.writeFileSync(dbName, JSON.stringify(arr ))
        }
        //have data already in the file
        //read in entire array and then out...
        else
        {
        console.log('writing to existing')
        // read the data
        let _data = fs.readFileSync(dbName, 'utf8')
        //parse as ab array
        let asArray = JSON.parse(_data)
        // add the new data
        asArray.push(obj)
        //write out
        fs.writeFileSync(dbName,JSON.stringify(asArray))
        }
 
    }
    catch (err) {
        console.log('save failed, ' + err)
    }
}

function updateJSONFile(userData, url) {
    // Read existing JSON data from the file
    const jsonData = JSON.parse(fs.readFileSync(url, 'utf-8'))

    // Extract nodes and links from the user data
    const { nodes, links } = userData

    // Append new nodes to the existing nodes array
    if (nodes && nodes.length > 0) {
        jsonData.nodes.push(...nodes)
    }

    // Append new links to the existing links array
    if (links && links.length > 0) {
        jsonData.links.push(...links)
    }

    // Write the updated JSON data back to the file
    fs.writeFileSync(url, JSON.stringify(jsonData))
}


module.exports = {readDb, writeDb, updateJSONFile}