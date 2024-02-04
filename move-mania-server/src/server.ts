import http from "http";

import { Server } from "socket.io";
import { SOCKET_EVENTS } from "./types";


const httpServer = http.createServer();

const PORT = 8080,
  HOST = "localhost";

const io = new Server(httpServer, {
  cors: {
    origin: "*", // or a list of origins you want to allow, e.g. ["http://localhost:3000"]
    credentials: true,
  },
});

httpServer.listen(PORT, HOST, () => {
  console.log("Server running on port:", PORT);
});

io.on("connection", (socket) => {
  console.log(socket.id);
  socket.on("message", (message) => {
    console.log(`Received message: ${message}`);
    io.emit("notification", message);
  });
  socket.on(SOCKET_EVENTS.SET_BET, (betData) => {
    console.log(`Received bet: ${JSON.stringify(betData)}`);
    io.emit(SOCKET_EVENTS.BET_CONFIRMED, betData);
  })
  
  socket.on(SOCKET_EVENTS.CASH_OUT, (cashOutData) => {
    console.log(`Received cash out: ${JSON.stringify(cashOutData)}`);
    io.emit(SOCKET_EVENTS.CASH_OUT_CONFIRMED, cashOutData);
  })
});




