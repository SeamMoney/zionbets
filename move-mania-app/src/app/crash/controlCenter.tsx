'use client';

import { cashOutBet, setNewBet, startRound } from "@/lib/server";
import { RoundStart, SOCKET_EVENTS } from "@/lib/types";
import { useEffect, useState } from "react"
import { Socket, io } from "socket.io-client";

export type GameStatus = {
  status: 'lobby' | 'countdown' | 'inProgress' | 'end',
  roundId?: number,
  startTime?: number,
  crashPoint?: number
}

export default function ControlCenter() {

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    status: 'lobby',
  })

  useEffect(() => {
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("Connected to WebSocket"));
    newSocket.on("disconnect", () =>
      console.log("Disconnected from WebSocket")
    );

    newSocket.on(SOCKET_EVENTS.ROUND_START, (data: RoundStart) => {
      console.log('SOCKET_EVENTS.ROUND_START', data);
      setGameStatus({
        status: 'countdown',
        roundId: data.roundId,
        startTime: data.startTime
      });
      

      setTimeout(() => {
        setGameStatus({
          status: 'inProgress',
          roundId: data.roundId,
          startTime: data.startTime
        });
      }, data.startTime - Date.now());
    });

    newSocket.on(SOCKET_EVENTS.ROUND_RESULT, (data: RoundStart) => {
      console.log('SOCKET_EVENTS.ROUND_RESULT', data);
      setGameStatus({
        status: 'end',
        roundId: undefined,
        startTime: undefined
      });
    });

  }, [])

  const onStartRound = () => {

    if (!socket) return;

    const success = startRound(socket);
    console.log('startRound', success)
  }

  const onSetBet = () => {

    if (!socket) return;

    const data = {
      roundId: 1, 
      playerUsername: `player-${Math.floor(Math.random() * 100)}`,
      betAmount: Math.floor(Math.random() * 100),
      coinType: 'APT'
    };
    const success = setNewBet(socket, data);
    console.log('setNewBet', data, success)
  }

  const onCashOut = () => {

    if (!socket) return;

    const data = {
      roundId: 1,
      playerUsername: `player-${Math.floor(Math.random() * 100)}`,
      cashOutMultiplier: Math.floor(Math.random() * 100),
    };
    const succes = cashOutBet(socket, data);
    console.log('cashOutBet', data, succes)
  }

  if (gameStatus.status === 'lobby') {
    return (
      <div>
        <button onClick={onStartRound}>
          Start next round and place bet
        </button>
      </div>
    )
  } else if (gameStatus.status === 'countdown') {
    return (
      <div>
        <button onClick={onSetBet}>
          Place bet
        </button>
      </div>
    )
  } else if (gameStatus.status === 'inProgress') {
    return (
      <div>
        <button onClick={onCashOut}>
          Cash out
        </button>
      </div>
    )
  }
}