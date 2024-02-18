"use client";

import {
  getCurrentGame,
  getUserBalance,
  hasUserBet,
  hasUserCashOut,
  setUpAndGetUser,
} from "@/lib/api";
import { User } from "@/lib/schema";
import { cashOutBet, setNewBet, startRound } from "@/lib/server";
import { RoundStart, SOCKET_EVENTS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

export type GameStatus = {
  status: "COUNTDOWN" | "IN_PROGRESS" | "END";
  roundId: number;
  startTime: number;
  crashPoint : number;
};

export default function ControlCenter() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [update, setUpdate] = useState(true);
  const [account, setAccount] = useState<User | null>(null);

  const [betAmount, setBetAmount] = useState("");

  const [hasBet, setHasBet] = useState(false);
  const [hasCashOut, setHasCashOut] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        if (!session.user) return;

        setUpAndGetUser({
          username: session.user.name || "",
          image: session.user.image || "",
          email: session.user.email || "",
        }).then((user) => {
          if (user) {
            setAccount(user);
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    if (update && account) {
      hasUserBet(account?.email || "").then((bet) => {
        setHasBet(bet);
      });

      hasUserCashOut(account?.email || "").then((cashout) => {
        setHasCashOut(cashout);
      });

      getCurrentGame().then((game) => {
        console.log('got game', game)
        if (game == null) {
          setGameStatus(null);
        } else {
          if (game.start_time > Date.now()) {
            console.log("COUNTDOWN")
            setGameStatus({
              status: "COUNTDOWN",
              roundId: game.round_id,
              startTime: game.start_time,
              crashPoint: game.secret_crash_point,
            });
            setTimeout(() => {
              setUpdate(true);
            }, game.start_time - Date.now());
          } else if (game.start_time + game.secret_crash_point * 1000 > Date.now()) {
            console.log("IN_PROGRESS")
            setGameStatus({
              status: "IN_PROGRESS",
              roundId: game.round_id,
              startTime: game.start_time,
              crashPoint: game.secret_crash_point,
            });
            setTimeout(() => {
              setUpdate(true);
            }, game.start_time + game.secret_crash_point * 1000 - Date.now());
          } else {
            console.log("END")
            setGameStatus({
              status: "END",
              roundId: game.round_id,
              startTime: game.start_time,
              crashPoint: game.secret_crash_point,
            });
          }
        }
      });

      setUpdate(false);
    }
  }, [update, account]);

  useEffect(() => {
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);

    newSocket.on(SOCKET_EVENTS.ROUND_START, (data: RoundStart) => {
      setUpdate(true);
    });

    // newSocket.on(SOCKET_EVENTS.ROUND_RESULT, (data: RoundStart) => {
    //   setUpdate(true);
    // });
  }, []);

  const onSetBet = () => {
    setUpdate(true);

    if (!socket) return;

    if (!account) return;

    const data = {
      roundId: 1,
      playerEmail: account.email || "",
      betAmount: parseFloat(betAmount),
      coinType: "APT",
    };
    const success = setNewBet(socket, data);
  };

  const onCashOut = () => {
    if (!socket) return;

    if (!account) return;

    if (!gameStatus?.startTime) return;

    const cashoutMultipler = (Date.now() - gameStatus.startTime) / 1000;

    const data = {
      roundId: 1,
      playerEmail: account.email || "",
      cashOutMultiplier: cashoutMultipler,
    };
    const succes = cashOutBet(socket, data);

    setUpdate(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-start justify-start gap-1">
      <div className=" flex flex-col items-start justify-around px-2 gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex flex-row justify-between px-4 py-2 border border-neutral-700 bg-neutral-800/20 bg-noise">
            <span className="font-mono font-light">BET</span>
            <span className="font-mono opacity-50 flex flex-row justify-center items-center gap-1">
              <input
                className="bg-transparent border-none outline-none text-right max-w-[40px]"
                value={betAmount}
                onChange={(e) => {
                  setBetAmount(e.target.value);
                }}
                placeholder="2.50"
                disabled={!(gameStatus?.startTime !== undefined && gameStatus.startTime > Date.now())}
              ></input>
              <span>APT</span>
            </span>
          </div>
          <div className="flex flex-row items-center text-xs">
            <div
              className={`border px-2 py-1 cursor-pointer ${
                parseFloat(betAmount) === 1
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => setBetAmount("1")}
            >
              1 APT
            </div>
            <div
              className={`border px-2 py-1 cursor-pointer ${
                parseFloat(betAmount) === 5
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => setBetAmount("5")}
            >
              5 APT
            </div>
            <div
              className={`border px-2 py-1 cursor-pointer ${
                parseFloat(betAmount) === 10
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => setBetAmount("10")}
            >
              10 APT
            </div>
            <div
              className={`border px-2 py-1 cursor-pointer ${
                parseFloat(betAmount) === 25
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => setBetAmount("25")}
            >
              25 APT
            </div>
          </div>
        </div>
        <div className="flex flex-row items-baseline gap-2 w-full">
          {
            !account && (
              <button
                className="border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 cursor-not-allowed w-full"
                disabled
              >
                Log in to play
              </button>
            )
          }
          {
            account && gameStatus?.status === "COUNTDOWN" && (
              <button
                className={cn(
                  "border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 w-full",
                  !(parseFloat(betAmount) > 0) || hasBet
                    ? "cursor-not-allowed"
                    : "hover:bg-[#264234]/40 hover:cursor-pointer",
                  hasBet && "bg-[#264234]/40"
                )}
                onClick={onSetBet}
                disabled={!(parseFloat(betAmount) > 0) || hasBet}
              >
                {
                  hasBet ? "Bet placed" : "Place bet"
                }
              </button>
            )
          }
          {
            account && gameStatus?.status === "IN_PROGRESS" && hasBet &&  (
              <button
                className={cn(
                  "border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 w-full ",
                  hasCashOut
                    ? "cursor-not-allowed bg-[#264234]/40"
                    : "hover:bg-[#264234]/40 hover:cursor-pointer",
                  hasCashOut && "bg-[#264234]/40"
                )}
                onClick={onCashOut}
                disabled={hasCashOut}
              >
                {
                  hasCashOut ? "Cashed out" : "Cash out"
                }
              </button>
            )
          }
          {
            account && gameStatus?.status === "IN_PROGRESS" && !hasBet &&  (
              <button
                className="border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 cursor-not-allowed w-full"
                disabled
              >
                Game in progress
              </button>
            )
          }
          {
            account && gameStatus?.status === "END" && (
              <button
                className="border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 cursor-not-allowed w-full"
                disabled
              >
                Game ended
              </button>
            )
          }
          {/* {((gameStatus?.startTime && gameStatus.startTime > Date.now()) ||
            gameStatus?.status === "END") && (
            <div className="bg-noise">
              <button
                className={cn(
                  "border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 ",
                  !(parseFloat(betAmount) > 0) || hasBet
                    ? "cursor-not-allowed"
                    : "hover:bg-[#264234]/40 hover:cursor-pointer",
                  hasBet && "bg-[#264234]/40"
                )}
                onClick={onSetBet}
                disabled={!(parseFloat(betAmount) > 0) || hasBet}
              >
                Bet
              </button>
            </div>
          )}
          {gameStatus?.status === "IN_PROGRESS" &&
            gameStatus.startTime &&
            gameStatus.startTime <= Date.now() && (
              <button
                className={cn(
                  "border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 ",
                  !(parseFloat(betAmount) > 0) || hasCashOut
                    ? "cursor-not-allowed"
                    : "hover:bg-[#264234]/40 hover:cursor-pointer",
                    hasCashOut && "bg-[#264234]/40"
                )}
                onClick={onCashOut}
                disabled={hasCashOut == true || hasBet == false}
              >
                Cash out
              </button>
            )} */}
        </div>
      </div>
    </div>
  );
}
