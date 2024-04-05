const {writeDb} = require('./dbFunction');
const obj = {
    // THIS IS WHAT I WANT TO WRITE USING WHEN I GET CLIENT MESSAGE | SEE LINE 25 in ./index.js where this function is called.
    // "nodes": [
    //     {
    //         "id": ""
    //     }

    // ],
    // "links": [
    //     {
    //         "source": "", 
    //         "target": ""
    //     }
    // ]
}
writeDb(obj);