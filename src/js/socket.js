/**
 *  //Communication protocol
 *  from client
 *  socket.emit('from-client',(arg)=>{
 *  arg='argument';
 *  });
 *
 *  //toserver
 *  io.on('connection',(socket)=>{
 *  socket.on('from-client',(arg)=>{
 *  console.log(arg);//'argument'
 *  });
 *  });
 *
 *  //from server
 *  io.on('connection',(socket)=>{
 *  socket.emit('from-server',(arg)=>{
 *  arg='argument';
 *  });
 *  });
 *  //to client
 *  socket.on('from-server',(arg)=>{
 *  console.log(arg);//'argument'
 *  });
 */

import { io } from "socket.io-client";

export function initSocket() {
  const EXPRESS_PORT = 3000;
  const ROOT_URL =
    window.location.hostname === "localhost"
      ? window.location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        EXPRESS_PORT
      : window.location.origin;

  const socket = io("http://localhost:" + 5555);

  // put socket listerners here e.g. `socket.on(...)`
  socket.on("chat message", (msg) => {
    console.log(msg);
  });
  socket.on("send-database", (database) => {
    // send this to initGraph: main.js
    let newDb = database
    console.log("@socket.js - newDb:", newDb)
  })
  // add socket listener to receive database from server, to be used in /src/forcegraph.js to replace the defaultDb object with database stored on server. 
  // and also find the db: node.id.index.length to find new target for ui.js at uploadBtnCallback(). 

  return socket;
}

