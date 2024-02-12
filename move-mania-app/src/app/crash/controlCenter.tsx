'use client';

import { getCurrentGame, getUserBalance, setUpAndGetUser } from "@/lib/api";
import { User } from "@/lib/schema";
import { cashOutBet, setNewBet, startRound } from "@/lib/server";
import { RoundStart, SOCKET_EVENTS } from "@/lib/types";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react"
import { Socket, io } from "socket.io-client";

export type GameStatus = {
  status: 'lobby' | 'countdown' | 'IN_PROGRESS' | 'END',
  roundId?: number,
  startTime?: number,
  crashPoint?: number
}

export default function ControlCenter() {

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    status: 'lobby',
    roundId: undefined,
    startTime: undefined,
    crashPoint: undefined
  })
  const [update, setUpdate] = useState(true);
  const [account, setAccount] = useState<User | null>(null);

  const [betAmount, setBetAmount] = useState('');

  const [playerBalance, setPlayerBalance] = useState(0);

  useEffect(() => {
    getSession().then(session => {
      if (session) {
        console.log(session)
        if (!session.user) return;

        setUpAndGetUser({
          username: session.user.name || '',
          image: session.user.image || '',
          email: session.user.email || '',
        }).then(user => {
          if (user) {
            setAccount(user)
          }
        })
      }
    })
  }, [])

  useEffect(() => {
    if (update && account) {
      getCurrentGame().then((game) => {
        console.log('getCurrentGame', game);
        if (game == null) {
          setGameStatus({
            status: 'lobby',
          })
        } else {
          setGameStatus({
            status: game.status,
            roundId: game.game_id,
            startTime: game.start_time,
            crashPoint: game.secret_crash_point
          });

          if (game.start_time > Date.now()) {
            setTimeout(() => {
              setUpdate(true);
            }, game.start_time - Date.now());
          }
        }
      });

      getUserBalance(account?.email || '').then((balance) => {
        console.log('getUserBalance', balance)
        setPlayerBalance(balance);
      });

      setUpdate(false);
    }
  }, [update, account])

  useEffect(() => {
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("Connected to WebSocket"));
    newSocket.on("disconnect", () =>
      console.log("Disconnected from WebSocket")
    );

    newSocket.on(SOCKET_EVENTS.ROUND_START, (data: RoundStart) => {
      console.log('SOCKET_EVENTS.ROUND_START', data);
      setUpdate(true);

      setTimeout(() => {
        setUpdate(true);
      }, data.startTime - Date.now());
    });

    newSocket.on(SOCKET_EVENTS.ROUND_RESULT, (data: RoundStart) => {
      console.log('SOCKET_EVENTS.ROUND_RESULT', data);
      setUpdate(true);
    });

  }, [])

  const onStartRound = () => {

    if (!socket) return;

    const success = startRound(socket);
    console.log('startRound', success)
  }

  const onSetBet = () => {

    if (!socket) return;

    if (!account) return;

    const data = {
      roundId: 1, 
      playerEmail: account.email || '',
      betAmount: parseInt(betAmount),
      coinType: 'APT'
    };
    const success = setNewBet(socket, data);
    console.log('setNewBet', data, success)
  }

  const onCashOut = () => {

    if (!socket) return;

    if (!account) return;

    if (!gameStatus.startTime) return;

    const cashoutMultipler = (Date.now() - gameStatus.startTime) / 1000;

    const data = {
      roundId: 1,
      playerEmail: account.email || '',
      cashOutMultiplier: cashoutMultipler,
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
        <button onClick={onStartRound}>
          Admin: start game
        </button>
        <span>
          balance: {playerBalance} APT
        </span>
      </div>
      <div className="w-full max-w-[600px] flex flex-row items-END justify-center px-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="border border-neutral-700 flex flex-row justify-between px-4 py-2">
            <span className="font-mono font-light">
              BET
            </span>
            <span className="font-mono opacity-50 flex flex-row justify-center items-center gap-1">
              <input className="bg-transparent border-none outline-none text-right max-w-[40px]" value={betAmount} onChange={(e) => {
                setBetAmount(e.target.value)
              }} placeholder="2.50" disabled={gameStatus.status == 'IN_PROGRESS'}></input><span>APT</span>
            </span>
          </div>
          <div className="flex flex-row items-center text-xs">
            <div className={
              `border px-2 py-1 cursor-pointer ${parseInt(betAmount) === 1 ? 'border-green-500 text-green-500' : 'opacity-50 border-neutral-700'}`
            } onClick={() => setBetAmount('1')}>
              1 APT
            </div>
            <div className={
              `border px-2 py-1 cursor-pointer ${parseInt(betAmount) === 5 ? 'border-green-500 text-green-500' : 'opacity-50 border-neutral-700'}`
            } onClick={() => setBetAmount('5')}>
              5 APT
            </div>
            <div className={
              `border px-2 py-1 cursor-pointer ${parseInt(betAmount) === 10 ? 'border-green-500 text-green-500' : 'opacity-50 border-neutral-700'}`
            } onClick={() => setBetAmount('10')}>
              10 APT
            </div>
            <div className={
              `border px-2 py-1 cursor-pointer ${parseInt(betAmount) === 25 ? 'border-green-500 text-green-500' : 'opacity-50 border-neutral-700'}`
            } onClick={() => setBetAmount('25')}>
              25 APT
            </div>
          </div>
        </div>
        {
          ((gameStatus.startTime && gameStatus.startTime > Date.now()) || gameStatus.status === 'END') && (
            <button className={
              `bg-green-500 text-neutral-950 px-8 py-1 ${parseInt(betAmount) > 0 ? '' : 'opacity-50 cursor-not-allowed'}` 
            } onClick={onSetBet} disabled={!(parseInt(betAmount) > 0)}>
              Bet
            </button>
          )
        }
        {
          gameStatus.status === 'IN_PROGRESS' && (gameStatus.startTime && gameStatus.startTime <= Date.now()) && (
            <button className="bg-green-500 text-neutral-950 px-8 py-1" onClick={onCashOut}>
              Cash out
            </button>
          )
        }
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
  } else if (gameStatus.status === 'IN_PROGRESS') {
    return (
      <div>
        <button onClick={onCashOut}>
          Cash out
        </button>
      </div>
    )
  }
}