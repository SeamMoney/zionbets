import http from "http";

import { Server } from "socket.io";
import { ChatMessage, SOCKET_EVENTS } from "./types";
import {
  addBetToPlayerList,
  addCashOutToPlayerList,
  addChatMessage,
  clearPlayerList,
  createGame,
  endGame,
  getUser,
  payOutPlayers,
} from "./database";

import crypto from 'crypto';
import { calculateCrashPoint } from "./crashPoint";

const COUNTDOWN = 20 * 1000;
const SUMMARY = 5 * 1000;

const httpServer = http.createServer();

const PORT = 8080,
  HOST = "localhost";

const io = new Server(httpServer, {
  cors: {
    origin: "*", // or a list of origins you want to allow, e.g. ["http://localhost:3000"]
    credentials: true,
  },
  connectionStateRecovery: {}
});

httpServer.listen(PORT, HOST, () => {
  console.log("Server running on port:", PORT);
});

io.on("connection", (socket) => {
  socket.on(SOCKET_EVENTS.SET_BET, async (betData) => {
    await addBetToPlayerList(betData);
    io.emit(SOCKET_EVENTS.BET_CONFIRMED, betData);
  });

  socket.on(SOCKET_EVENTS.CASH_OUT, async (cashOutData) => {
    await addCashOutToPlayerList(cashOutData);
    io.emit(SOCKET_EVENTS.CASH_OUT_CONFIRMED, cashOutData);
  });

  socket.on(SOCKET_EVENTS.START_ROUND, async () => {
    await clearPlayerList();
    let crashPoint = calculateCrashPoint(crypto.randomInt(0, 100), crypto.randomBytes(16).toString('hex'));
    if (crashPoint <= 1) {
      crashPoint = 0;
    }
    const startTime = Date.now() + COUNTDOWN;
    const gameId = Math.random().toString(36).substring(7);
    await createGame({
      game_id: gameId,
      start_time: startTime,
      secret_crash_point: crashPoint,
      status: "IN_PROGRESS",
    });
    io.emit(SOCKET_EVENTS.ROUND_START, {
      roundId: 1,
      startTime: Date.now() + COUNTDOWN,
      crashPoint,
    });

    setTimeout(async () => {
      await endGame(gameId);
      await payOutPlayers();
      io.emit(SOCKET_EVENTS.ROUND_RESULT, { roundId: 1, crashPoint });
      setTimeout(async () => {
        await cycleRounds();
      }, SUMMARY);
    }, COUNTDOWN + (crashPoint == 0 ? 0 : crashPoint - 1) * 1000);
  });

  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async (message) => {
    await addChatMessage({
      authorEmail: message.authorEmail,
      message: message.message,
    });
    io.emit(SOCKET_EVENTS.CHAT_NOTIFICATION, message);
  });
});

async function cycleRounds() {
  await clearPlayerList();
  let crashPoint = calculateCrashPoint(crypto.randomInt(0, 100), crypto.randomBytes(16).toString('hex'));
  if (crashPoint <= 1) {
    crashPoint = 0;
  }
  const startTime = Date.now() + COUNTDOWN;
  const gameId = Math.random().toString(36).substring(7);
  await createGame({
    game_id: gameId,
    start_time: startTime,
    secret_crash_point: crashPoint,
    status: "IN_PROGRESS",
  });
  io.emit(SOCKET_EVENTS.ROUND_START, {
    roundId: 1,
    startTime: Date.now() + COUNTDOWN,
    crashPoint,
  });

  setTimeout(async () => {
    await endGame(gameId);
    await payOutPlayers();
    io.emit(SOCKET_EVENTS.ROUND_RESULT, { roundId: 1, crashPoint });
    setTimeout(async () => {
      await cycleRounds();
    }, SUMMARY);
  }, COUNTDOWN + (crashPoint == 0 ? 0 : crashPoint - 1) * 1000);
}
