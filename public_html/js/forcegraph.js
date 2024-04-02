// import {
//     UnrealBloomPass
// } from '//unpkg.com/three/examples/jsm/postprocessing/UnrealBloomPass.js';


import SpriteText from "//unpkg.com/three-spritetext/dist/three-spritetext.mjs";
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
let ww = window.innerWidth, wh = window.innerHeight;
let x, y, z, vx, vy, vz;
let navw = 200; // UI elements
let navh = 200;

// Get the root element
const root = document.documentElement;
const Graph = ForceGraph3D();
const graphCont = document.getElementById('GRAPH');
let style = getComputedStyle(root);
let colorPri = style.getPropertyValue('--c-pri');
let colorGraph = style.getPropertyValue('--c-graph');

let uiH = style.getPropertyValue('--ui-h');
// GRAPH STYLING


window.addEventListener('resize', () => {
    ww = window.innerWidth, wh = window.innerHeight;
});

Graph(graphCont)
.backgroundColor(colorGraph)
.linkOpacity(1)
.linkWidth(0.4)
.linkColor('#0F0')
.jsonUrl('../datasets/ono.json')
.nodeThreeObject(node => {
    const sprite = new SpriteText(node.id);
    sprite.material.depthWrite = false;
    sprite.color = colorPri;
    sprite.fontFace = 'Helvetica';
    sprite.textHeight = 5;
    // console.log(node);
    return sprite;
})
.nodeLabel('id')
.onNodeClick( node => {
    // console.log(node.id)
    let links = Graph.graphData().links;
    let nodeSiblings = links.filter((link) => link.source.id === node.id || link.target.id === node.id);
    console.log(nodeSiblings);
    
    // Graph.linkDirectionalParticles(nodeSiblings)
})
// .onNodeClick(triggerAudio(node.id))
// .onNodeRightClick('showFileMenu')
// .onNodeHover('showHovText')
// .onNodeDragStart(...); 

.onEngineTick(() => {
    graphCont.style.left = 100 + 'px';
    Graph.width(ww - navw).height(wh - navh)
        // Graph.getGraphBbox().nodes
        .graphData().nodes.forEach(node => {
            // var id = node.id;
            x = node.x; // use to pan sound
            y = node.y; // ?
            z = node.z; // ?
            vx = node.vx; // use to play the audio at velocity speed
            vy = node.vy; // vx + vy + vz & negative vals are read as positive
            vz = node.vz; // ""
            // samplePan(x);
            
        }) // value property
        // Graph.linkDirectionalParticleSpeed(d => d.value * 0.0001); // replace 0.001 by env follower.
    });



Graph.d3Force('charge').strength(-30)
Graph.d3Force('link').distance(30)
Graph.d3Force('center').x(w => w.width / 2).y(h => h.height / 2)
        
// const bloomPass = new UnrealBloomPass();
// bloomPass.strength = 0.5;
// bloomPass.radius = 0.5;
// bloomPass.threshold = 0;
// Graph.postProcessingComposer().addPass(bloomPass);


