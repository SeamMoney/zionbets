"use client";

import { getCurrentGame, getPlayerList } from "@/lib/api";
import { BetData, CashOutData, RoundStart, SOCKET_EVENTS } from "@/lib/types";
import { useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { GameStatus } from "./controlCenter";
import { cn } from "@/lib/utils";

import { socket } from "@/lib/socket";
import { gameStatusContext } from "./CrashProvider";

export type PlayerState = {
  username: string;
  betAmount: number;
  coinType: string;
  cashOutMultiplier: number | null;
};

export default function PlayerList() {
  const {
    gameStatus,
    latestAction
  } = useContext(gameStatusContext);
  // const [updateList, setUpdateList] = useState(true);
  const [players, setPlayers] = useState<PlayerState[]>([]);

  useEffect(() => {
    getPlayerList().then((players) => {
      setPlayers(players);
    });
    // // set dummy data
    // setPlayers([
    //   {
    //     username: "user1",
    //     betAmount: 100,
    //     coinType: "BTC",
    //     cashOutMultiplier: 2.5,
    //   },
    //   {
    //     username: "user2",
    //     betAmount: 200,
    //     coinType: "BTC",
    //     cashOutMultiplier: 2.5,
    //   },
    //   {
    //     username: "user3",
    //     betAmount: 300,
    //     coinType: "BTC",
    //     cashOutMultiplier: 2.5,
    //   },
    //   {
    //     username: "user4",
    //     betAmount: 400,
    //     coinType: "BTC",
    //     cashOutMultiplier: 2.5,
    //   },
    //   {
    //     username: "user5",
    //     betAmount: 500,
    //     coinType: "BTC",
    //     cashOutMultiplier: 2.5,
    //   },
    //   {
    //     username: "user6",
    //     betAmount: 600,
    //     coinType: "BTC",
    //     cashOutMultiplier: 2.5,
    //   },
    //   {
    //     username: "user7",
    //     betAmount: 700,
    //     coinType: "BTC",
    //     cashOutMultiplier: null,
    //   },
    //   {
    //     username: "user8",
    //     betAmount: 800,
    //     coinType: "BTC",
    //     cashOutMultiplier: 2.5,
    //   },
    //   {
    //     username: "user9",
    //     betAmount: 900,
    //     coinType: "BTC",
    //     cashOutMultiplier: 2.5,
    //   },
    //   {
    //     username: "user10",
    //     betAmount: 1000,
    //     coinType: "BTC",
    //     cashOutMultiplier: null,
    //   },
    // ]);
  }, [latestAction]);

  // useEffect(() => {
  //   if (update) {
  //     getPlayerList().then((players) => {
  //       setPlayers(players);
  //     });

  //     getCurrentGame().then((game) => {
        
  //       if (game == null) {
  //         setGameStatus(null);
  //       } else {
  //         if (game.start_time > Date.now()) {
  //           console.log("COUNTDOWN - playerList.tsx")
  //           setGameStatus({
  //             status: "COUNTDOWN",
  //             roundId: game.round_id,
  //             startTime: game.start_time,
  //             crashPoint: game.secret_crash_point,
  //           });
  //           setTimeout(() => {
  //             setUpdate(true);
  //           }, game.start_time - Date.now());
  //         } else if (game.start_time + game.secret_crash_point * 1000 > Date.now()) {
  //           console.log("IN_PROGRESS - playerList.tsx")
  //           setGameStatus({
  //             status: "IN_PROGRESS",
  //             roundId: game.round_id,
  //             startTime: game.start_time,
  //             crashPoint: game.secret_crash_point,
  //           });
  //           setTimeout(() => {
  //             setUpdate(true);
  //           }, game.start_time + game.secret_crash_point * 1000 - Date.now());
  //         } else {
  //           console.log("END - playerList.tsx")
  //           setGameStatus({
  //             status: "END",
  //             roundId: game.round_id,
  //             startTime: game.start_time,
  //             crashPoint: game.secret_crash_point,
  //           });
  //         }
  //       }
  //     });

  //     setUpdate(false);
  //   }
  // }, [update]);

  // useEffect(() => {
  //   socket.on("disconnect", () => {
  //     console.log("DISCONNECTED - playerList.tsx"); 
  //   });

  //   socket.on(SOCKET_EVENTS.ROUND_START, () => {
  //     setUpdate(true);
  //   });

  //   socket.on(SOCKET_EVENTS.ROUND_RESULT, (data: RoundStart) => {
  //     setUpdate(true);
  //   });

  //   socket.on(SOCKET_EVENTS.BET_CONFIRMED, (data: BetData) => {
  //     setUpdate(true);
  //   });

  //   socket.on(SOCKET_EVENTS.CASH_OUT_CONFIRMED, (data: CashOutData) => {
  //     setUpdate(true);
  //   });
  // }, []);

  return (
    <div className="border border-neutral-700 h-full flex flex-col items-left gap-2 w-[350px] min-h-[200px] max-h-[700px]">
      <span className="font-semibold text-lg pt-1 ps-4">Live Bets</span>
      <table className="w-full scroll">
        <thead className="">
          <tr className="border-b border-neutral-800 text-neutral-400">
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
            if (gameStatus?.status == 'COUNTDOWN') {
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
            <tr key={index} className="text-white text-sm font-mono h-8">
              {gameStatus?.status == "END" ? ( // IF the game has ended
                player.cashOutMultiplier ? (
                  <td className="w-[200px] text-left ps-4 text-green-500 bg-[#264234]/40 border-b border-neutral-800">
                    {player.username}
                  </td>
                ) : (
                  <td className="w-[200px] text-left ps-4 text-red-500 bg-[#3F221E]/40 border-b border-neutral-800">
                    {player.username}
                  </td>
                )
              ) : player.cashOutMultiplier ? (
                <td className="w-[200px] text-left ps-4 text-green-500 bg-[#264234]/40 border-b border-neutral-800">
                  {player.username}
                </td>
              ) : (
                <td className="w-[200px] text-left ps-4 bg-neutral-800/40 bg-[#264234]/40 border-b border-neutral-800">{player.username}</td>
              )}
              {gameStatus?.status == "END" ? (
                player.cashOutMultiplier ? (
                  <td className={cn("w-[100px] text-center text-green-500 bg-[#264234]/40 border-b border-neutral-800")}>
                    {player.cashOutMultiplier.toFixed(2)}
                  </td>
                ) : (
                  <td className="w-[100px] text-center text-red-500 bg-[#3F221E]/40 border-b border-neutral-800">0.00</td>
                )
              ) : player.cashOutMultiplier ? (
                <td className={cn("w-[100px] text-center text-green-500 bg-[#264234]/40 border-b border-neutral-800")}>
                  {player.cashOutMultiplier.toFixed(2)}
                </td>
              ) : (
                <td className="w-[100px] text-center bg-neutral-800/40 bg-[#264234]/40 border-b border-neutral-800">--</td>
              )}
              {gameStatus?.status == "END" ? ( // IF the game has ended
                player.cashOutMultiplier ? (
                  <td className="w-[100px] text-right pr-4 font-mono text-green-500 bg-[#264234]/40 border-b border-neutral-800">
                    +{(player.betAmount * player.cashOutMultiplier).toFixed(2)}
                  </td>
                ) : (
                  <td className="w-[100px] text-right pr-4 font-mono text-red-500 bg-[#3F221E]/40 border-b border-neutral-800">
                    -{player.betAmount.toFixed(2)}
                  </td>
                )
              ) : player.cashOutMultiplier ? (
                <td className="w-[100px] text-right pr-4 font-mono text-green-500 bg-[#264234]/40 border-b border-neutral-800">
                  +{(player.betAmount * player.cashOutMultiplier).toFixed(2)}
                </td>
              ) : (
                <td className="w-[100px] text-right pr-4 font-mono bg-neutral-800/40 bg-[#264234]/40 border-b border-neutral-800">
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
