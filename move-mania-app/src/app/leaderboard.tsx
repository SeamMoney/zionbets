"use client";

import { getCurrentGame, getPlayerList, getUsers } from "@/lib/api";
import { BetData, CashOutData, RoundStart, SOCKET_EVENTS } from "@/lib/types";
import { useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import { GameStatus } from "./controlCenter";
import { cn } from "@/lib/utils";

import { socket } from "@/lib/socket";
import { gameStatusContext } from "./CrashProvider";
import { getBalance } from "@/lib/aptos";

export type PlayerState = {
  username: string;
  public_address: string;
  balance: number;
};

export default function Leaderboard() {
  const {
    gameStatus,
    latestAction
  } = useContext(gameStatusContext);
  // const [updateList, setUpdateList] = useState(true);
  const [users, setUsers] = useState<PlayerState[]>([]);

  useEffect(() => {
    getUsers().then((users) => {
      console.log('users', users)
      getBalances(users).then((balances) => {
        setUsers(balances);
      });
    });
  }, [latestAction]);

  const getBalances = async (users: {username: string, public_address: string, private_key: string}[]) => {
    const balances = await Promise.all(
      users.map(async (user) => {
        const balance = await getBalance(user.private_key, '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::z_apt::ZAPT');
        return {
          ...user,
          balance,
        };
      })
    );
    return balances;
  }

  return (
    <div className="border border-neutral-700 h-full flex flex-col items-left gap-2 w-full min-h-[200px] max-h-[700px]">
      <span className="font-semibold text-lg pt-1 ps-4">zAPT Leaderboard</span>
      <table className="w-full scroll">
        <thead className="">
          <tr className="border-b border-neutral-800 text-neutral-400">
            <th className="w-[200px] text-left ps-4">Username</th>
            <th className="w-[100px] text-right pr-4">
              Balance{" "}
              <span className="text-neutral-500  text-xs">apt</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users
          .sort((a, b) => {
            return b.balance - a.balance;
          })
          .slice(0, 10)
          .map((player, index) => (
            <tr key={index} className="text-white text-sm  h-8">
              <td className="ps-4 w-[200px] text-left ps-4 bg-neutral-800/40 bg-[#264234]/40 border-b border-neutral-800">{player.username}</td>
              <td className="text-right pr-4 w-[100px] text-right pr-4  bg-neutral-800/40 bg-[#264234]/40 border-b border-neutral-800">
                {player.balance.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
