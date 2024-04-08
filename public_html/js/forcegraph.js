import SpriteText from "//unpkg.com/three-spritetext/dist/three-spritetext.mjs";

let ww = window.innerWidth, wh = window.innerHeight;
// let x, y, z, vx, vy, vz;
let navw = 200; // UI elements
let navh = 200;

// Get the root element
const Graph = ForceGraph3D();
const graphCont = document.getElementById('GRAPH');
const databasePath = "../datasets/ono.json";
const root = document.documentElement;
let style = getComputedStyle(root);
let colorPri = style.getPropertyValue('--c-pri');
let colorGraph = style.getPropertyValue('--c-graph');
var database;
  
socket.on('init-database', (data) => {
    database = data;
    Graph.graphData(database)
});
socket.on('database-changed', (data) => {
    console.log('change')
    database = data;
    Graph.graphData(database)
});
window.addEventListener('resize', () => {
    ww = window.innerWidth, wh = window.innerHeight;
});
Graph(graphCont)
.backgroundColor(colorGraph)
.linkOpacity(1)
.linkWidth(0.1)
.linkColor('#0F0')
// .graphData(database)
.jsonUrl(databasePath)
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
.onNodeClick( (node) => {
    // console.log(node.id)
    let links = Graph.graphData().links;
    let nodeSiblings = links.filter((link) => link.source.id === node.id || link.target.id === node.id);
    console.log(nodeSiblings);
    
    Graph.linkDirectionalParticles(nodeSiblings)
})
.onEngineTick(() => {
    graphCont.style.left = 100 + 'px';
    Graph.width(ww - navw).height(wh - navh)
        // .graphData().nodes.forEach(node => {
            // var id = node.id;
            // x = node.x; // use to pan sound
            // y = node.y; // ?
            // z = node.z; // ?
            // vx = node.vx; // use to play the audio at velocity speed
            // vy = node.vy; // vx + vy + vz & negative vals are read as positive
            // vz = node.vz; // ""
            // samplePan(x);
        // })
    });

Graph.d3Force('charge').strength(-30)
Graph.d3Force('link').distance(30)
Graph.d3Force('center').x(w => w.width / 2).y(h => h.height / 2)