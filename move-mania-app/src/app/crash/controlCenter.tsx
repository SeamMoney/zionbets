"use client";

import {
  getCurrentGame,
  getUserBalance,
  hasUserBet,
  hasUserCashOut,
  setUpAndGetUser,
} from "@/lib/api";
import { User } from "@/lib/schema";
import { cashOutBet, setNewBet, startRound } from "@/lib/socket";
import { RoundStart, SOCKET_EVENTS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { time } from "console";
import { getSession } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

import { socket } from "@/lib/socket";
import { gameStatusContext } from "./CrashProvider";

export type GameStatus = {
  status: "COUNTDOWN" | "IN_PROGRESS" | "END";
  roundId: string;
  startTime: number;
  crashPoint : number;
};

export default function ControlCenter() {
  const {
    gameStatus,
    account,
    latestAction
  } = useContext(gameStatusContext);

  const [betAmount, setBetAmount] = useState("");

  const [autoCashout, setAutoCashout] = useState(false);
  const [autoCashoutAmount, setAutoCashoutAmount] = useState("");

  const [hasBet, setHasBet] = useState(false);
  const [hasCashOut, setHasCashOut] = useState(false);

  useEffect(() => {
    console.log('account', account)
    if (account) {
      console.log('updating hasBet and hasCashOut')
      hasUserBet(account?.email || "").then((bet) => {
        setHasBet(bet);
      });

      hasUserCashOut(account?.email || "").then((cashout) => {
        setHasCashOut(cashout);
      });

    }
  }, [gameStatus, account, latestAction]);

  useEffect(() => {
    console.log('gameStatus', gameStatus?.status)
    if (gameStatus?.status === "IN_PROGRESS") {
      console.log('setting bet and cashout to false')
      checkAutoCashout();
    }
  }, [gameStatus]);

  const checkAutoCashout = () => {
    const timeUntilCrash = gameStatus?.startTime! + (gameStatus?.crashPoint!) * 1000 - Date.now();
    const timeUntilCashout = gameStatus?.startTime! + parseFloat(autoCashoutAmount)! * 1000 - Date.now();

    console.log('hasBet', hasBet)

    if (hasBet && autoCashout && timeUntilCashout < timeUntilCrash && timeUntilCashout > 0) {
      console.log('setting auto cashout')
      setTimeout(() => {
        console.log('auto cashout')
        onCashOut();
      }, timeUntilCashout - 1000);
    }
  }

  const onSetBet = () => {

    if (!socket) return;

    if (!account) return;

    const data = {
      roundId: 1,
      playerEmail: account.email || "",
      betAmount: parseFloat(betAmount),
      coinType: "APT",
    };
    const success = setNewBet(data);
  };

  const onCashOut = () => {
    if (!socket) return;

    if (!account) return;

    if (!gameStatus?.startTime) return;

    const cashoutMultipler = (Date.now() - gameStatus.startTime) / 1000 + 1;

    const data = {
      roundId: 1,
      playerEmail: account.email || "",
      cashOutMultiplier: cashoutMultipler,
    };
    const succes = cashOutBet(data);

  };

  return (
    <div className="w-full h-full flex flex-col gap-4 min-[550px]:flex-row items-start min-[550px]:items-center min-[550px]:justify-between gap-1">


      <div className=" flex flex-col items-start justify-around px-2 gap-2 w-full">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex flex-row justify-between px-4 py-2 border border-neutral-700 bg-neutral-800/20 bg-noise w-full">
            <span className="font-light">BET</span>
            <span className="opacity-50 flex flex-row justify-center items-center gap-1">
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
          <div className="flex flex-row items-center text-xs w-full">
            <div
              className={`border px-2 py-1 cursor-pointer grow text-center ${
                parseFloat(betAmount) === 1
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => setBetAmount("1")}
            >
              1 APT
            </div>
            <div
              className={`border px-2 py-1 cursor-pointer grow text-center ${
                parseFloat(betAmount) === 5
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => setBetAmount("5")}
            >
              5 APT
            </div>
            <div
              className={`border px-2 py-1 cursor-pointer grow text-center ${
                parseFloat(betAmount) === 10
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => setBetAmount("10")}
            >
              10 APT
            </div>
            <div
              className={`border px-2 py-1 cursor-pointer grow text-center ${
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
        </div>
      </div>


      <div className=" flex flex-col items-start justify-around px-2 gap-2 w-full">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex flex-row justify-between px-4 py-2 border border-neutral-700 bg-neutral-800/20 bg-noise">
            <span className="font-light">AUTO CASHOUT @</span>
            <span className="opacity-50 flex flex-row justify-center items-center gap-0">
              <input
                className="bg-transparent border-none outline-none text-right max-w-[40px]"
                value={autoCashoutAmount}
                onChange={(e) => {
                  setAutoCashout(false);
                  setAutoCashoutAmount(e.target.value);
                }}
                placeholder="2.50"
              ></input>
              <span>x</span>
            </span>
          </div>
          <div className="flex flex-row items-center text-xs">
            <div
              className={`text-center border px-2 py-1 cursor-pointer grow ${
                parseFloat(autoCashoutAmount) === 1.01
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => {
                setAutoCashout(false);
                setAutoCashoutAmount("1.01");
              }}
            >
              1.01x
            </div>
            <div
              className={`text-center border px-2 py-1 cursor-pointer grow ${
                parseFloat(autoCashoutAmount) === 1.5
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => {
                setAutoCashout(false);
                setAutoCashoutAmount("1.5");
              }}
            >
              1.5x
            </div>
            <div
              className={`text-center border px-2 py-1 cursor-pointer grow ${
                parseFloat(autoCashoutAmount) === 2
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => {
                setAutoCashout(false);
                setAutoCashoutAmount("2");
              }}
            >
              2x
            </div>
            <div
              className={`text-center border px-2 py-1 cursor-pointer grow ${
                parseFloat(autoCashoutAmount) === 5
                  ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                  : "opacity-50 border-neutral-700"
              }`}
              onClick={() => {
                setAutoCashout(false);
                setAutoCashoutAmount("5");
              }}
            >
              5x
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
                Log in to set auto cash out
              </button>
            )
          }
          {
            account && (
              <button
                className={cn(
                  "border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 w-full",
                    autoCashout && "bg-[#264234]/40"
                )}
                onClick={() => {
                  setAutoCashout(!autoCashout);
            
                }}
              >
                {
                  autoCashout ? "Turn off auto cashout" : "Turn on auto cashout"
                }
              </button>
            )
          }
        </div>
      </div>


    </div>
  );
}