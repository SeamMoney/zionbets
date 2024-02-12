"use client";

import { getCurrentGame, getPlayerList } from "@/lib/api";
import { BetData, CashOutData, SOCKET_EVENTS } from "@/lib/types";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { GameStatus } from "./controlCenter";
import { cn } from "@/lib/utils";

export type PlayerState = {
  username: string;
  betAmount: number;
  coinType: string;
  cashOutMultiplier: number | null;
};

export default function PlayerList() {
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    status: "lobby",
    roundId: undefined,
    startTime: undefined,
    crashPoint: undefined,
  });
  const [update, setUpdate] = useState(true);
  const [updateList, setUpdateList] = useState(true);
  const [players, setPlayers] = useState<PlayerState[]>([]);

  useEffect(() => {
    if (updateList) {
      getPlayerList().then((players) => {
        setPlayers(players);
      });
      setUpdateList(false);
    }
  }, [updateList]);

  useEffect(() => {
    if (update) {
      getCurrentGame().then((game) => {
        if (game == null) {
          setGameStatus({
            status: "lobby",
          });
        } else {
          setGameStatus({
            status: game.status,
            roundId: game.game_id,
            startTime: game.start_time,
            crashPoint: game.secret_crash_point,
          });

          if (game.start_time > Date.now()) {
            setTimeout(() => {
              setUpdate(true);
            }, game.start_time - Date.now());
          }
        }
      });

      setUpdate(false);
    }
  }, [update]);

  useEffect(() => {
    const newSocket = io("http://localhost:8080");

    newSocket.on(SOCKET_EVENTS.ROUND_START, () => {
      setPlayers([]);
      setUpdate(true);
    });

    newSocket.on(SOCKET_EVENTS.BET_CONFIRMED, (data: BetData) => {
      setUpdateList(true);
      setUpdate(true);
    });

    newSocket.on(SOCKET_EVENTS.CASH_OUT_CONFIRMED, (data: CashOutData) => {
      setUpdateList(true);
      setUpdate(true);
    });

    newSocket.on(SOCKET_EVENTS.ROUND_RESULT, (data: any) => {
      setUpdateList(true);
      setUpdate(true);
    });
  }, []);

  return (
    <div className="bg-neutral-950 border border-neutral-700 h-full flex flex-col items-left gap-2">
      <span className="font-semibold text-lg pt-1 ps-4">Live Bets</span>
      <table className="w-full scroll">
        <thead className="">
          <tr className="border-b border-neutral-700 text-neutral-400">
            <th className="w-[200px] text-left ps-4">Username</th>
            <th className="w-[100px] text-center">
              Multiplier{" "}
              <span className="text-neutral-500 font-mono text-xs">x</span>
            </th>
            <th className="w-[100px] text-right pr-4">
              Bet{" "}
              <span className="text-neutral-500 font-mono text-xs">apt</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {players
          .sort((a, b) => {
            if (gameStatus.status == "lobby") {
              return b.betAmount - a.betAmount;
            } else {
              if (a.cashOutMultiplier && b.cashOutMultiplier) {
                return b.cashOutMultiplier - a.cashOutMultiplier;
              } else if (a.cashOutMultiplier) {
                return 1;
              } else if (b.cashOutMultiplier) {
                return -1;
              } else {
                return b.betAmount - a.betAmount;
              }
            }
          })
          .map((player, index) => (
            <tr key={index} className="text-white text-sm font-mono h-4">
              {gameStatus.status == "lobby" ? ( // IF the game has ended
                player.cashOutMultiplier ? (
                  <td className="w-[200px] text-left ps-4 text-green-500">
                    {player.username}
                  </td>
                ) : (
                  <td className="w-[200px] text-left ps-4 text-red-500">
                    {player.username}
                  </td>
                )
              ) : player.cashOutMultiplier ? (
                <td className="w-[200px] text-left ps-4 text-green-500">
                  {player.username}
                </td>
              ) : (
                <td className="w-[200px] text-left ps-4">{player.username}</td>
              )}
              {gameStatus.status == "lobby" ? (
                player.cashOutMultiplier ? (
                  <td className={cn("w-[100px] text-center text-green-500")}>
                    {player.cashOutMultiplier.toFixed(2)}
                  </td>
                ) : (
                  <td className="w-[100px] text-center text-red-500">0.00</td>
                )
              ) : player.cashOutMultiplier ? (
                <td className={cn("w-[100px] text-center text-green-500")}>
                  {player.cashOutMultiplier.toFixed(2)}
                </td>
              ) : (
                <td className="w-[100px] text-center">--</td>
              )}
              {gameStatus.status == "lobby" ? ( // IF the game has ended
                player.cashOutMultiplier ? (
                  <td className="w-[100px] text-right pr-4 font-mono text-green-500">
                    +{(player.betAmount * player.cashOutMultiplier).toFixed(2)}
                  </td>
                ) : (
                  <td className="w-[100px] text-right pr-4 font-mono text-red-500">
                    -{player.betAmount.toFixed(2)}
                  </td>
                )
              ) : player.cashOutMultiplier ? (
                <td className="w-[100px] text-right pr-4 font-mono text-green-500">
                  +{(player.betAmount * player.cashOutMultiplier).toFixed(2)}
                </td>
              ) : (
                <td className="w-[100px] text-right pr-4 font-mono">
                  -{player.betAmount.toFixed(2)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
