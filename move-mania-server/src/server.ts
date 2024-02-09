import http from "http";

import { Server } from "socket.io";
import { SOCKET_EVENTS } from "./types";

const COUNTDOWN = 20 * 1000; // 20 seconds
const SUMMARY = 20 * 1000; // 20 seconds

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
  socket.on(SOCKET_EVENTS.SET_BET, (betData) => {
    console.log(`Received bet: ${JSON.stringify(betData)}`);
    io.emit(SOCKET_EVENTS.BET_CONFIRMED, betData);
  })
  
  socket.on(SOCKET_EVENTS.CASH_OUT, (cashOutData) => {
    console.log(`Received cash out: ${JSON.stringify(cashOutData)}`);
    io.emit(SOCKET_EVENTS.CASH_OUT_CONFIRMED, cashOutData);
  })

  socket.on(SOCKET_EVENTS.START_ROUND, () => {
    console.log('Starting round');
    const crashPoint = (Math.random() * 10);
    console.log(`Round crashed at ${crashPoint}`);
    io.emit(SOCKET_EVENTS.ROUND_START, { roundId: 1, startTime: Date.now() + COUNTDOWN, crashPoint });

    setTimeout(() => {
      io.emit(SOCKET_EVENTS.ROUND_RESULT, { roundId: 1, crashPoint });
      setTimeout(() => {
        cycleRounds();
      }, COUNTDOWN);
    }, COUNTDOWN + crashPoint * 1000);
  })

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (message) => {
    console.log(`Received chat message: ${JSON.stringify(message)}`);
    io.emit(SOCKET_EVENTS.CHAT_NOTIFICATION, message);
  })
});

function cycleRounds() {
  console.log('cycling rounds');
  const crashPoint = (Math.random() * 10);
  console.log(`Round crashed at ${crashPoint}`);
  io.emit(SOCKET_EVENTS.ROUND_START, { roundId: 1, startTime: Date.now() + COUNTDOWN, crashPoint });

  setTimeout(() => {
    io.emit(SOCKET_EVENTS.ROUND_RESULT, { roundId: 1, crashPoint });
    setTimeout(() => {
      cycleRounds();
    }, SUMMARY);
  }, COUNTDOWN + crashPoint * 1000);
}




