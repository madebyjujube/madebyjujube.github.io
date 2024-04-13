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
  const EXPRESS_PORT = 5555;
  const ROOT_URL =
    window.location.hostname === "localhost"
      ? window.location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        EXPRESS_PORT
      : window.location.origin;

  const socket = io("http://localhost:" + EXPRESS_PORT);

  // put socket listerners here e.g. `socket.on(...)`

  return socket;
}

