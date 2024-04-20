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
import SpriteText from "three-spritetext";
import ForceGraph3D from "3d-force-graph";
import { graph, socket, audio } from "./main.js";

export function initDatabase() {
  const defaultDb = {
    nodes: [{ id: "1" }, { id: "2" }],
    links: [
      {
        source: "1",
        target: "2",
        value: 10,
      },
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

  const graphCont = document.getElementById("GRAPH");
  
  window.addEventListener("resize", () => {
    resizeGraph(graph, graphCont)
  });

  
  graph(graphCont)
    .backgroundColor(colorGraph)
    .linkDirectionalParticleColor(() => "90F")
    .linkDirectionalParticleWidth(2)
    .linkColor(() => colorPri )
    .linkWidth(0.4)
    .nodeThreeObject((node) => {
      const sprite = new SpriteText(node.id);
      sprite.material.depthWrite = false;
      sprite.color = colorPri;
      sprite.fontFace = "ab-kokikaku";
      sprite.textHeight = 12;
      return sprite;
    })
    .nodeLabel("id")
    .onNodeClick(async (node) => {
      // audio.panNode()
      await audio.trigNodeSound(node)
      generateParticle(graph, node)
    })
    
    graph.d3Force("charge").strength(-100);
    graph.d3Force("link").distance(80);
    graph
    .d3Force("center")
    .x((w) => w.width / 2)
    .y((h) => h.height / 2);
    
    resizeGraph(graph, graphCont);
  return graph;
}

/**
 * Replaces the graph data with the database data.
 */
export function populateGraph(graph, database) {
  graph.graphData(database);
  return graph;
}

/**
 * Updates the global database object with the nodes and links of the new database.
 */
export function updateDatabase(database, newDatabase) {
  database.nodes = newDatabase.nodes;
  database.links = newDatabase.links;
  return database;
}

/**
 * Adds a new node to the database.
 * @param {Database} database - the database to add the node to.
 * @param {Node} newNode - an object that follows the shape:
 * ```
 * {
 *   id: string,
 *   source: string,
 *   target: string
 * }
 *```
 */
export function addNewNodeToDatabase(database, newNode) {
  console.log("connection: ", newNode);
  database.nodes.push({ id: newNode.id });
  database.links.push({
    source: newNode.source,
    target: newNode.target,
  });
  return database;
}

export function resizeGraph(graph, graphCont) {
  const ww = window.innerWidth;
  const wh = window.innerHeight;
  const navh = 200;
  const navw = 200;
  graphCont.style.top = 100 + "px";
  if (window.innerWidth < 1300) {
    graphCont.style.left = 0 + "px";
    graph.width(ww).height(wh - navh);
  } else {
    graphCont.style.left = 100 + "px";
    graph.width(ww - navw).height(wh - navh);
  }
}


function generateParticle(graph, node) {
  const links = graph.graphData().links;
  const nodeSiblings = links.filter(
    (link) => 
    link.source.id === node.id || 
    link.target.id === node.id,
  );
  const source = nodeSiblings[0];
  const target = nodeSiblings[1];

  graph.emitParticle(source);
  graph.emitParticle(target);
}


// function panAudio(graph, node) {

  // audio panning:
  // const coord = {
  //   id: node.id,
  //   x: node.x,
  //   y: node.y,
  //   z: node.z,
  // };
  
  // console.log(coord);
// }
