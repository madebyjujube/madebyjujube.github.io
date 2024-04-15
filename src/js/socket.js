import { io } from "socket.io-client";
import {
  addNewNode, 
  populateGraph
} from './forcegraph.js'
import { 
  graph,
  iDatabase, 
  newDb
} from "./main.js";
export function initSocket() {
  // const EXPRESS_PORT = 3000;
  // const ROOT_URL =
  //   window.location.hostname === "localhost"
  //     ? window.location.protocol +
  //       "//" +
  //       window.location.hostname +
  //       ":" +
  //       EXPRESS_PORT
  //     : window.location.origin;

  const socket = io("http://localhost:" + 5555);
  // put socket listerners here e.g. `socket.on(...)`

  socket.on("database", (newDatabase) => {
    populateGraph(graph, newDatabase, iDatabase)
    console.log(newDatabase)
  })
  socket.on("new-node", (node) => {
    addNewNode(graph, newDb, node);
  })
  
  socket.on("chat message", (msg) => {
    console.log(msg);
  });

  return socket;
}

