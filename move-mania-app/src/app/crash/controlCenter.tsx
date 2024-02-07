'use client';

import { Slider } from "@/components/ui/slider";
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

  return (
    <div className="w-full h-full flex flex-col items-center justify-start gap-1">
      <div className="w-full flex flex-row gap-4 items-center justify-start">
        <span className="cursor-pointer">
          Manual
        </span>
        <span className="cursor-pointer opacity-50">
          Automatic
        </span>
      </div>
      <div className="w-full max-w-[600px] flex flex-row items-center justify-center px-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="border border-neutral-700 flex flex-row justify-between px-4 py-2">
            <span className="font-mono font-light">
              BET
            </span>
            <span className="font-mono opacity-50 flex flex-row justify-center items-center gap-1">
              <input className="bg-transparent border-none outline-none max-w-[40px]" placeholder="2.50"></input><span>APT</span>
            </span>
          </div>
          <div className="flex flex-row items-center text-xs">
            <div className="border border-neutral-700 opacity-50 px-2 py-1">
              1 APT
            </div>
            <div className="border border-green-500 text-green-500 px-2 py-1">
              5 APT
            </div>
            <div className="border border-neutral-700 opacity-50 px-2 py-1">
              10 APT
            </div>
            <div className="border border-neutral-700 opacity-50 px-2 py-1">
              25 APT
            </div>
          </div>
        </div>
        <button className="bg-green-500 text-neutral-950 px-8 py-1">
          Bet
        </button>
      </div>
    </div>
  )

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