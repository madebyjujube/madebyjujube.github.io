import {
    UnrealBloomPass
} from '//unpkg.com/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import SpriteText from "//unpkg.com/three-spritetext/dist/three-spritetext.mjs";
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
let x, y, z;
let width = window.innerWidth;
let height = window.innerHeight;

const Graph = ForceGraph3D();

Graph(document.getElementById('3d-graph'))
    .backgroundColor('#000')
    .jsonUrl('../datasets/miserables.json')
    .nodeThreeObject(node => {
        const sprite = new SpriteText(node.id);
        sprite.material.depthWrite = false;
        sprite.color = '#90F';
        sprite.fontFace = 'Helvetica';
        sprite.textHeight = 10;
        return sprite;
    })
    // .onNodeClick(triggerAudio)
    // .onNodeRightClick(showFileMenu)
    // .onNodeHover(showHovText)
    // .onNodeDragStart(dragStart);

    .onEngineTick(() => {
        Graph.graphData().nodes.forEach(node => {
            // var id = node.id;
            x = node.x;
            y = node.y;
            z = node.z;
            // samplePan(x);
        });

    });

Graph.d3Force('charge').strength(-500)
Graph.d3Force('link').distance(100)
Graph.d3Force('center').x(w => w.width / 2).y(h => h.height / 2)

const bloomPass = new UnrealBloomPass();
bloomPass.strength = 1;
bloomPass.radius = 1;
bloomPass.threshold = 0;
Graph.postProcessingComposer().addPass(bloomPass);