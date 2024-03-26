import {
    UnrealBloomPass
} from '//unpkg.com/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import SpriteText from "//unpkg.com/three-spritetext/dist/three-spritetext.mjs";
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';

const Graph = ForceGraph3D();

Graph(document.getElementById('3d-graph'))
    .backgroundColor('#000')
    .jsonUrl('../datasets/miserables.json')

    // .nodeThreeObject() is Node object accessor function or attribute for generating a custom 3d object to render as graph nodes. 
    .nodeThreeObject(node => {
        const sprite = new SpriteText(node.id);
        // console.log(sprite); // logs array, and should be accessible outside the function. 
        sprite.material.depthWrite = false;
        sprite.color = '#90F';
        sprite.fontFace = 'Helvetica';
        sprite.textHeight = 16;
        return sprite;
    })
    // .onNodeClick(triggerAudio)
    // .onNodeRightClick(showFileMenu)
    // .onNodeHover(showHovText)
    // .graph2ScreenCoords(x, y, z)

    //.onNodeDragStart(dragStart);

// console.log(Graph.graphData());
// Spread nodes a little wider
Graph.d3Force('charge').strength(-500);
Graph.d3Force('link').distance(100);
Graph.d3Force('center').x(w => w.width / 2).y(h => h.height / 2);

// console.log(Graph.d3Force('center')); // logs: NaN

const bloomPass = new UnrealBloomPass();
bloomPass.strength = 0.1;
bloomPass.radius = 0.5;
bloomPass.threshold = 0;
Graph.postProcessingComposer().addPass(bloomPass);
