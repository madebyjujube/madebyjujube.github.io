function doesOxLikes(thing) {
  if (thing === "mochi") {
    return true;
  }
  return false;
}

const oxLikesCake = doesOxLikes("cakes");
const oxLikesMochi = doesOxLikes("mochi");

// app.js
// USING readDb() instead:
// function readSync(path) {
//     let database = JSON.parse(fs.readFileSync(path))
//     return database
// }

// what should my functions do?
//

// let x, y, z, vx, vy, vz
// inside onEngineTick
// .graphData().nodes.forEach(node => {
// var id = node.id
// x = node.x // use to pan sound
// y = node.y // ?
// z = node.z // ?
// vx = node.vx // use to play the audio at velocity speed
// vy = node.vy // vx + vy + vz & negative vals are read as positive
// vz = node.vz // ""
// samplePan(x)
// })

// const databasePath = "../datasets/ono.json"
BackendMessages: socket.on("init-database", (data) => {
  // events
  console.log("mewooooooooewww", data);
  // model
});
socket.on("database-changed", (data) => {
  console.log("change");
  database = data;
  Graph.graphData(database);
});

function changeGraphData(graph, newData) {
  graph.graphData(newData);
  return graph;
}

// const newDb = new Database(data.nodes, data.links)
Graph = changeGraphData(Graph, newData);

// .onEngineTick(() => {
//     resizeGraph()
//     })

// from intangible.js promise something
// ox refactor
//
// promise maker: check db
// async function getDatabase() {
//     // let url = '../assets/datasets/ono.json'
//     const response = await fetch(url)
//     console.log(response)
//     try {
//         const data = await response.json()
//     }
//     catch(e) {
//        console.log("json parsing error:", e)
//     }

//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve(data)
//             reject('error')
//         }, 100)
//     })
// }
// // promise receiver: determine target

// function findTarget(data) {
//     let countNodes = data.nodes.length
//     let randIndex = Math.round(Math.random() * countNodes)
//     let newTarget = data.nodes[randIndex].id
//     return newTarget

// }
// function onSuccess(data) {
//     console.log('success:', data)
// }
// function onError(error) {
//     console.log('error:', error)
// }

// let newTargetName = await getDatabase().then(onSuccess, onError).then(findTarget)
// console.log(newTargetName)

