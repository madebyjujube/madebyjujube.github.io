import { io } from "socket.io-client";
import {
  addNewNodeToDatabase,
  populateGraph,
  updateDatabase,
} from "./forcegraph.js";
import { graph, database } from "./main.js";
export function initSocket() {
  const EXPRESS_PORT = 5555;
  const ROOT_URL =
    window.location.hostname === "localhost"
      ? window.location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        EXPRESS_PORT
      : window.location.origin;
  
  // const socket = io(window.location.hostname + ':' + 5555);
  const socket = io(ROOT_URL);
  // put socket listerners here e.g. `socket.on(...)`

  socket.on("database", (newDatabase) => {
    updateDatabase(database, newDatabase);
    populateGraph(graph, database);
  });

  socket.on("new-node", (node) => {
    addNewNodeToDatabase(database, node);
    populateGraph(graph, database);
  });

  // socket.on("chat message", (msg) => {
  //   console.log(msg);
  // });

  return socket;
}
