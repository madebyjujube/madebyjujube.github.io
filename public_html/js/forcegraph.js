import SpriteText from "//unpkg.com/three-spritetext/dist/three-spritetext.mjs";
let ww = window.innerWidth, wh = window.innerHeight;
// let x, y, z, vx, vy, vz;
let navw = 200; // UI elements
let navh = 200;

// Get the root element
const root = document.documentElement;
const Graph = ForceGraph3D();
const graphCont = document.getElementById('GRAPH');
let style = getComputedStyle(root);
let colorPri = style.getPropertyValue('--c-pri');
let colorGraph = style.getPropertyValue('--c-graph');

window.addEventListener('resize', () => {
    ww = window.innerWidth, wh = window.innerHeight;
});
// .graphData(initData)
Graph(graphCont)
.backgroundColor(colorGraph)
.linkOpacity(1)
.linkWidth(0.1)
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