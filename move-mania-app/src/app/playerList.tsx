"use client";

import { getPlayerList } from "@/lib/api";
import { CashOutData, SOCKET_EVENTS } from "@/lib/types";
import { useContext, useEffect, useState } from "react";
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
  const { gameStatus, latestAction } = useContext(gameStatusContext);
  const [players, setPlayers] = useState<PlayerState[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const fetchedPlayers = await getPlayerList();
        console.log("Fetched players:", fetchedPlayers);
        setPlayers(fetchedPlayers || []);
      } catch (error) {
        console.error("Error fetching players:", error);
        setPlayers([]);
      }
    };

    fetchPlayers();

    const handleCashOut = (data: CashOutData) => {
      console.log("Cash out data received:", data);
      setPlayers(prevPlayers => {
        const updatedPlayers = prevPlayers.map(player =>
          player.username === data.playerEmail
            ? { ...player, cashOutMultiplier: data.cashOutMultiplier }
            : player
        );
        console.log("Updated players after cash out:", updatedPlayers);
        return updatedPlayers;
      });
    };

    socket.on(SOCKET_EVENTS.CASH_OUT_CONFIRMED, handleCashOut);
    console.log("Listening for cash out events");

    return () => {
      socket.off(SOCKET_EVENTS.CASH_OUT_CONFIRMED, handleCashOut);
      console.log("Stopped listening for cash out events");
    };
  }, [latestAction]); // We keep latestAction as the only dependency

  console.log("PlayerList rendering, players:", players);

  const sortedPlayers = players.sort((a, b) => {
    if (gameStatus?.status === 'COUNTDOWN') {
      return b.betAmount - a.betAmount;
    } else {
      if (a.cashOutMultiplier && b.cashOutMultiplier) {
        return b.cashOutMultiplier - a.cashOutMultiplier;
      } else if (a.cashOutMultiplier) {
        return -1;
      } else if (b.cashOutMultiplier) {
        return 1;
      } else {
        return b.betAmount - a.betAmount;
      }
    }
  });

  return (
    <div className="border border-neutral-700 h-full flex flex-col items-left gap-2 w-full min-h-[200px] max-h-[700px]">
      <span className="font-semibold text-lg pt-1 ps-4">Live Bets</span>
      <table className="w-full scroll">
        <thead>
          <tr className="border-b border-neutral-800 text-neutral-400">
            <th className="w-[200px] text-left ps-4">Username</th>
            <th className="w-[100px] text-center">
              Multiplier <span className="text-neutral-500 text-xs">x</span>
            </th>
            <th className="w-[100px] text-right pr-4">
              Bet <span className="text-neutral-500 text-xs">cash</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player, index) => (
              <tr key={index} className="text-white text-sm h-8">
                <td className={cn(
                  "w-[200px] text-left ps-4 border-b border-neutral-800",
                  gameStatus?.status === "END"
                    ? player.cashOutMultiplier
                      ? "text-green-500 bg-[#264234]/40"
                      : "text-red-500 bg-[#3F221E]/40"
                    : player.cashOutMultiplier
                      ? "text-green-500 bg-[#264234]/40"
                      : "bg-neutral-800/40"
                )}>
                  {player.username}
                </td>
                <td className={cn(
                  "w-[100px] text-center border-b border-neutral-800",
                  gameStatus?.status === "END"
                    ? player.cashOutMultiplier
                      ? "text-green-500 bg-[#264234]/40"
                      : "text-red-500 bg-[#3F221E]/40"
                    : player.cashOutMultiplier
                      ? "text-green-500 bg-[#264234]/40"
                      : "bg-neutral-800/40"
                )}>
                  {player.cashOutMultiplier ? player.cashOutMultiplier.toFixed(2) : (gameStatus?.status === "END" ? "0.00" : "--")}
                </td>
                <td className={cn(
                  "w-[100px] text-right pr-4 border-b border-neutral-800",
                  gameStatus?.status === "END"
                    ? player.cashOutMultiplier
                      ? "text-green-500 bg-[#264234]/40"
                      : "text-red-500 bg-[#3F221E]/40"
                    : player.cashOutMultiplier
                      ? "text-green-500 bg-[#264234]/40"
                      : "bg-neutral-800/40"
                )}>
                  {player.cashOutMultiplier
                    ? `+${(player.betAmount * player.cashOutMultiplier).toFixed(2)}`
                    : `-${player.betAmount.toFixed(2)}`}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="text-center py-4 text-neutral-400">No active players</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}