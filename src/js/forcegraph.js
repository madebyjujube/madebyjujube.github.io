// model view controller
// init , UI , events

import * as THREE from 'three';
import SpriteText from "//unpkg.com/three-spritetext/dist/three-spritetext.mjs"
import ForceGraph3D from '3d-force-graph';

// import { socket } from "./main.js"

// Get the root element
const Graph = ForceGraph3D();

// EVENTS=>()
window.addEventListener("resize", resizeGraph);

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

// class Database {
//     nodes = []
//     links = []
//     constructor(nodes, links) {
//         this.nodes = nodes
//         this.links = links
//     }
// }

function resizeGraph() {
  const navw = 200;
  const navh = 200;
  const ww = window.innerWidth;
  const wh = window.innerHeight;
  Graph.width(ww - navw).height(wh - navh);
}

trigAudioGraph();

export function initGraph() {
  const graphCont = document.getElementById("GRAPH");
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const colorPri = style.getPropertyValue("--c-pri");
  const colorGraph = style.getPropertyValue("--c-graph");
  graphCont.style.left = 100 + "px";

  Graph(graphCont)
    .backgroundColor(colorGraph)
    .linkOpacity(1)
    .linkWidth(0.1)
    .linkColor("#0F0")
    .graphData(defaultDb)
    .nodeThreeObject((node) => {
      const sprite = new SpriteText(node.id);
      sprite.material.depthWrite = false;
      sprite.color = colorPri;
      sprite.fontFace = "Helvetica";
      sprite.textHeight = 5;
      return sprite;
    })
    .nodeLabel("id");

  Graph.d3Force("charge").strength(-30);
  Graph.d3Force("link").distance(30);
  Graph.d3Force("center")
    .x((w) => w.width / 2)
    .y((h) => h.height / 2);

  resizeGraph();
}

// function generateParticles(coord) {
//   Graph.emitParticle(coord);
// }

function trigAudioGraph() {
  Graph.onNodeClick((node) => {
    // audio panning:
    const coord = {
      id: node.id,
      x: node.x,
      y: node.y,
      z: node.z,
    };
    const links = Graph.graphData().links;
    const nodeSiblings = links.filter(
      (link) => link.source.id === node.id || link.target.id === node.id,
    );
    console.log(nodeSiblings);
    // generateParticles(nodeSiblings[0].source, nodeSiblings[0].target);
    // console.log(coord);
  });
}

