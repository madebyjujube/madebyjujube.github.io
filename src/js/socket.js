import { io } from "socket.io-client";
import {
  addNewNode, 
  populateGraph,
  updateDatabase
} from './forcegraph.js'
import { 
  graph,
  database
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

  socket.on("database", (database) => {
    populateGraph(graph, database)
    updateDatabase(database)
  })
  socket.on("new-node", (node) => {
    let newdb = updateDatabase();
    addNewNode(graph, newdb, node);
  })
  
  socket.on("chat message", (msg) => {
    console.log(msg);
  });

  return socket;
}

