'use client';

import { Socket, io } from "socket.io-client";
import { BetData, CashOutData, ChatMessage, SOCKET_EVENTS } from "./types";

export const socket = io(process.env.ZION_API_URL ? "https://api.zionapi.xyz:8080" : "http://localhost:8080", {
  auth: {
    token: process.env.ZION_API_KEY || "",
  },
});

export function startRound(): boolean {
  if (socket.disconnected || !socket.connected) {
    console.error("Socket is not connected");
    return false;
  }

  socket.emit(SOCKET_EVENTS.START_ROUND);
  return true;
}

export function setNewBet(betData: BetData): boolean {
  if (socket.disconnected || !socket.connected) {
    console.error("Socket is not connected");
    return false;
  }

  socket.emit(SOCKET_EVENTS.SET_BET, betData);
  return true;
}

export function cashOutBet(cashOutData: CashOutData): boolean {
  if (socket.disconnected || !socket.connected) {
    console.error("Socket is not connected");
    return false;
  }

  console.log("Attempting to emit cash out event:", cashOutData);
  socket.emit(SOCKET_EVENTS.CASH_OUT, cashOutData, (response: any) => {
    console.log("Cash out event emitted, response:", response);
  });
  return true;
}

export function sendMessage(message: ChatMessage): boolean {
  if (socket.disconnected || !socket.connected) {
    console.error("Socket is not connected");
    return false;
  }

  socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
  return true;
}
