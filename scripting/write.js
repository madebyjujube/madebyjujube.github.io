const {writeDb} = require('./dbFunctions');

const obj = {
    name: `${$1}`,
    age: 30,
    hobbies: ['reading', 'playing', 'coding']
}

writeDb(obj);