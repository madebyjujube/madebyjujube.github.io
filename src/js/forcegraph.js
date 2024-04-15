/**
 * SERVER>CLIENT comms. 
 * - send initial database from server ONCE.
 * - Assign it to the model defaultDb.
 * - on upload, add new node:
 * - send it to server, 
 * - and back to client
 * - update graph with new database. 
 * 
 * AUDIO
 * - 
 */
// model view controller
// init , UI , events
import SpriteText from 'three-spritetext';
import ForceGraph3D from '3d-force-graph';
import { graph, socket } from "./main.js"

export function initDatabase() {
  const defaultDb = {
    nodes: [
      { id: "1" }, 
      { id: "2" }],
    links: [
      {
        source: "1",
        target: "2",
        value: 10,
      }
    ],
  };
  return defaultDb;
}

export function initGraph() {
  const graph = ForceGraph3D();

  const root = document.documentElement;
  const style = getComputedStyle(root);
  const colorPri = style.getPropertyValue("--c-pri");
  const colorGraph = style.getPropertyValue("--c-graph");

  window.addEventListener("resize", resizeGraph);
  
  const graphCont = document.getElementById("GRAPH");
  
  graphCont.style.left = 100 + "px";
  graph(graphCont)
  .backgroundColor(colorGraph)
  .linkWidth(0.4)
  .nodeThreeObject((node) => {
    const sprite = new SpriteText(node.id);
    sprite.material.depthWrite = false;
    sprite.color = colorPri;
    sprite.fontFace = "Helvetica";
    sprite.textHeight = 12;
    return sprite;
  })
  .nodeLabel("id")
  .onNodeClick((node) => {
    // trigAudioGraph(node)
  })

  graph.d3Force("charge").strength(-30);
  graph.d3Force("link").distance(30);
  graph.d3Force("center")
    .x((w) => w.width / 2)
    .y((h) => h.height / 2);

  resizeGraph(graph);
  
  return graph
}

//export populates the graph()
export function populateGraph(graph, database) {
  graph.graphData(database)
  // return database
}

export function addNewNode(graph, database, newNode) {
  console.log('addNewNode',database)
  let target = findTarget(database)
  database.nodes.push({ id: newNode });
  database.links.push({source: newNode, target: target});
  graph.graphData(database)
}
function findTarget(database) {
  console.log('findTarget',database)
  let countN = database.nodes.length-2;
  let index = Math.round(Math.random() * countN)
  let newTarget = database.nodes[index].id;
  return newTarget 
}
function resizeGraph(graph) {
  const navw = 200;
  const navh = 200;
  const ww = window.innerWidth;
  const wh = window.innerHeight;
  graph.width(ww - navw).height(wh - navh);
}

// function generateParticles(coord) {
//   Graph.emitParticle(coord);
// }

// function trigAudioGraph(graph, node) {
//     // audio panning:
//   const coord = {
//     id: node.id,
//     x: node.x,
//     y: node.y,
//     z: node.z,
//   };
//   const links = graph.graphData().links;
//   const nodeSiblings = links.filter(
//     (link) => link.source.id === node.id || link.target.id === node.id,
//   );
//   console.log(nodeSiblings);
//   // generateParticles(nodeSiblings[0].source, nodeSiblings[0].target);
//   // console.log(coord);
// };

