import { Socket } from "socket.io-client";
import { BetData, CashOutData, ChatMessage, SOCKET_EVENTS } from "./types";

export function startRound(socket: Socket): boolean {
  if (socket.disconnected || !socket.connected) {
    console.error("Socket is not connected");
    return false;
  }

  socket.emit(SOCKET_EVENTS.START_ROUND);
  return true;
}

export function setNewBet(socket: Socket, betData: BetData): boolean {
  if (socket.disconnected || !socket.connected) {
    console.error("Socket is not connected");
    return false;
  }

  socket.emit(SOCKET_EVENTS.SET_BET, betData);
  return true;
}

export function cashOutBet(socket: Socket, cashOutData: CashOutData): boolean {
  if (socket.disconnected || !socket.connected) {
    console.error("Socket is not connected");
    return false;
  }

  socket.emit(SOCKET_EVENTS.CASH_OUT, cashOutData);
  return true;
}

export function sendMessage(socket: Socket, message: ChatMessage): boolean {
  if (socket.disconnected || !socket.connected) {
    console.error("Socket is not connected");
    return false;
  }

  socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
  return true;
}
