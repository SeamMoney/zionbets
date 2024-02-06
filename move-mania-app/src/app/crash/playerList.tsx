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

    // fill player list with dummy data
    setPlayers([
      { username: 'player1', betAmount: 100, coinType: 'BTC', cashOutMultiplier: null },
      { username: 'player2', betAmount: 200, coinType: 'BTC', cashOutMultiplier: null },
      { username: 'player3', betAmount: 300, coinType: 'BTC', cashOutMultiplier: null },
      { username: 'player4', betAmount: 400, coinType: 'BTC', cashOutMultiplier: null },
      { username: 'player5', betAmount: 500, coinType: 'BTC', cashOutMultiplier: null },
      { username: 'player6', betAmount: 600, coinType: 'BTC', cashOutMultiplier: null },
      { username: 'player7', betAmount: 700, coinType: 'BTC', cashOutMultiplier: null },
      { username: 'player8', betAmount: 800, coinType: 'BTC', cashOutMultiplier: null },
      { username: 'player9', betAmount: 900, coinType: 'BTC', cashOutMultiplier: null },
      { username: 'player10', betAmount: 1000, coinType: 'BTC', cashOutMultiplier: null },
    ]);
  }, [])

  return (
    <div className="bg-neutral-950 border border-neutral-700 h-full flex flex-col items-center py-1 px-2 gap-2">
      <table className="w-full scroll">
        <thead>
          <tr className="text-green-400 text-center">
            <th className="w-[300px] text-left">Username</th>
            <th className="w-[50px]">@</th>
            <th className="w-[150px]">Bet</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={index} className="text-white text-center">
              <td className="w-[300px] text-left">{player.username}</td>
              <td className="w-[50px] text-center">{player.cashOutMultiplier || '...'}</td>
              {
                player.cashOutMultiplier == null
                ? <td className="w-[150px]">- {player.betAmount} {player.coinType}</td>
                : player.cashOutMultiplier === 0
                ? <td className="w-[150px]">- {player.betAmount} {player.coinType}</td> : 
                <td className="w-[150px]">+ {player.betAmount * player.cashOutMultiplier} {player.coinType}</td>
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}