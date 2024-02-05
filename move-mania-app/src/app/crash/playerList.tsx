'use client';

import { BetData, CashOutData, RoundResult, SOCKET_EVENTS } from "@/lib/types";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

export type PlayerState = {
  username: string;
  betAmount: number;
  coinType: string;
  cashOutMultiplier: number | null;
}


export default function PlayerList() {

  const [players, setPlayers] = useState<PlayerState[]>([]);


  useEffect(() => {
    const newSocket = io("http://localhost:8080");

    newSocket.on("connect", () => console.log("Connected to WebSocket"));

    newSocket.on("disconnect", () => console.log("Disconnected from WebSocket"));

    newSocket.on(SOCKET_EVENTS.ROUND_START, () => {
      console.log('SOCKET_EVENTS.ROUND_START', 'Emptying players');
      setPlayers([]);
    });
    
    newSocket.on(SOCKET_EVENTS.BET_CONFIRMED, (data: BetData) => {
      console.log('SOCKET_EVENTS.BET_CONFIRMED', data);
      const newPlayer = {
        username: data.playerUsername,
        betAmount: data.betAmount,
        coinType: data.coinType,
        cashOutMultiplier: null
      }
      setPlayers([newPlayer, ...players]);
    });

    newSocket.on(SOCKET_EVENTS.CASH_OUT_CONFIRMED, (data: CashOutData) => {
      console.log('SOCKET_EVENTS.BET_CASHED_OUT', data);
      const newPlayers = players.map(player => {
        if (player.username === data.playerUsername) {
          player.cashOutMultiplier = data.cashOutMultiplier;
        }
        return player;
      }).sort((a, b) => {
        if (a.cashOutMultiplier == null) {
          return 1;
        } else if (b.cashOutMultiplier == null) {
          return -1;
        } else {
          return a.cashOutMultiplier - b.cashOutMultiplier;
        }
      });
      setPlayers(newPlayers);
    });

    newSocket.on(SOCKET_EVENTS.ROUND_RESULT, (data: RoundResult) => {
      console.log('SOCKET_EVENTS.ROUND_RESULT', data);
      const newPlayers = players.map(player => {
        if (player.cashOutMultiplier == null) {
          player.cashOutMultiplier = 0
        } 
        return player;
      }).sort((a, b) => {
        if (a.cashOutMultiplier == null) {
          return -1;
        } else if (b.cashOutMultiplier == null) {
          return 1;
        } else {
          return a.cashOutMultiplier - b.cashOutMultiplier;
        }
      
      });

      setPlayers(newPlayers);
    });
  })

  return (
    <div>
      <span>
        Player List
      </span>
      <div>
        {players.map((player, index) => (
          <div key={index}>
            <span>Player: {player.username}</span>
            <span>Cash Out: {player.cashOutMultiplier}</span>
            <span>Bet: {player.betAmount} {player.coinType}</span>
          </div>
        ))}
      </div>
    </div>
  )
}