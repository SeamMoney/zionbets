"use client";

import {
  getCurrentGame,
  getUserBalance,
  hasUserBet,
  hasUserCashOut,
} from "@/lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { User } from "@/lib/schema";
import { cashOutBet, setNewBet, startRound } from "@/lib/socket";
import { RoundStart, SOCKET_EVENTS } from "@/lib/types";
import { EXPONENTIAL_FACTOR, calculateCurrentCrashPoint, cn, log } from "@/lib/utils";
import { time } from "console";
import { getSession } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

import { socket } from "@/lib/socket";
import { gameStatusContext } from "./CrashProvider";
import { cashOut, placeBet } from "@/lib/aptos";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { keylessContext } from "./KeylessProvider";
import { CHAIN_MODE } from "@/constants";

export type GameStatus = {
  status: "COUNTDOWN" | "IN_PROGRESS" | "END";
  roundId: string;
  startTime: number;
  crashPoint : number;
};

export default function ControlCenter() {
  const {
    gameStatus,
    latestAction
  } = useContext(gameStatusContext);
  const { isLoggedIn, userInfo, keylessAccount} = useContext(keylessContext);

  const { toast } = useToast()

  const [betAmount, setBetAmount] = useState("");

  const [autoCashout, setAutoCashout] = useState(false);
  const [autoCashoutAmount, setAutoCashoutAmount] = useState("");

  const [hasBet, setHasBet] = useState(false);
  const [hasCashOut, setHasCashOut] = useState(false);

  useEffect(() => {
    if (isLoggedIn && userInfo) {
      hasUserBet(userInfo.address || "").then((bet) => {
        setHasBet(bet);
      });

      hasUserCashOut(userInfo.address || "").then((cashout) => {
        setHasCashOut(cashout);
      });

    }
  }, [gameStatus, isLoggedIn, userInfo, latestAction]);

  useEffect(() => {
    if (gameStatus?.status === "IN_PROGRESS") {
      checkAutoCashout();
    }
  }, [gameStatus]);

  const checkAutoCashout = () => {
    const timeUntilCrash = gameStatus?.startTime! + log(EXPONENTIAL_FACTOR, gameStatus?.crashPoint!) * 1000 - Date.now();
    const timeUntilCashout = gameStatus?.startTime! + log(EXPONENTIAL_FACTOR, parseFloat(autoCashoutAmount)!) * 1000 - Date.now();
    if (hasBet && autoCashout && timeUntilCashout < timeUntilCrash && timeUntilCashout > 0) {
      setTimeout(() => {
        onCashOut();
      }, timeUntilCashout);
    }
  }

  const onSetBet = async () => {

    if (!socket) return;

    if (!isLoggedIn || !userInfo || !keylessAccount) return;

    toast({
      title: "Placing bet at " + betAmount + " zAPT...",
    })

    const blockchainRes = await placeBet(keylessAccount, {
      roundId: 1,
      playerEmail: userInfo.address,
      betAmount: parseFloat(betAmount),
      coinType: "APT",
    })

    if (!blockchainRes) {
      console.error('Error placing bet');
      toast({
        title: "Error placing bet",
        description: "Please try again"
      })
      return;
    }

    const data = {
      roundId: 1,
      playerEmail: userInfo.address,
      betAmount: parseFloat(betAmount),
      coinType: "APT",
    };
    const success = setNewBet(data);

    toast({
      title: "Bet placed at " + betAmount + " zAPT",
      description: <Link href={`https://explorer.aptoslabs.com/txn/${blockchainRes.version}/?network=${CHAIN_MODE}`} target="_blank" className="underline">View transaction</Link>
    })
  };

  const onCashOut = async () => {
    if (!socket) return;

    if (!userInfo || !isLoggedIn || !keylessAccount) return;

    if (!gameStatus?.startTime) return;

    const cashoutMultipler = Number(calculateCurrentCrashPoint((Date.now() - gameStatus.startTime) / 1000).toFixed(2));

    toast({
      title: "Cashing out at " + cashoutMultipler + "x...",
    })


    const blockchainRes = await cashOut(keylessAccount, {
      roundId: 1,
      playerEmail: userInfo.address,
      cashOutMultiplier: cashoutMultipler,
    });

    if (!blockchainRes) {
      console.error('Error cashing out');
      toast({
        title: "Error cashing out",
        description: "Please try again"
      })
      return;
    }

    const data = {
      roundId: 1,
      playerEmail: userInfo.address,
      cashOutMultiplier: cashoutMultipler,
    };
    const succes = cashOutBet(data);

    toast({
      title: "Cashed out at " + cashoutMultipler + "x",
      description: <Link href={`https://explorer.aptoslabs.com/txn/${blockchainRes.version}/?network=${CHAIN_MODE}`} target="_blank" className="underline">View transaction</Link>
    })

  };

  return (
    <div className="w-full h-full flex flex-col gap-4 items-start p-2">
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
        <div className="flex flex-row items-baseline gap-2 w-full text-lg">
          {
            !(isLoggedIn && userInfo) && (
              <button
                className="border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 cursor-not-allowed w-full"
                disabled
              >
                Log in to play
              </button>
            )
          }
          {
            isLoggedIn && userInfo && gameStatus?.status === "COUNTDOWN" && (
              <button
                className={cn(
                  "border border-green-700 px-6 py-1 border-yellow-700 text-yellow-500 bg-neutral-950 w-full",
                  !hasBet
                    ? "cursor-not-allowed"
                    : "bg-[#264234]/40 hover:cursor-pointer border-green-700 text-green-500",
                    (parseFloat(betAmount) > 0) && !hasBet && "bg-[#404226]/40 active:scale-95 active:opacity-80 transition-transform",
                )}
                onClick={onSetBet}
                disabled={!(parseFloat(betAmount) > 0) || hasBet}
              >
                {
                  hasBet ? "Bet placed" : (parseFloat(betAmount) > 0) ? "Place bet" : "Enter bet amount"
                }
              </button>
            )
          }
          {
            isLoggedIn && userInfo && gameStatus?.status === "IN_PROGRESS" && hasBet &&  (
              <button
                className={cn(
                  "border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 w-full",
                  hasCashOut
                    ? "cursor-not-allowed bg-[#264234]/40"
                    : "hover:bg-[#404226]/40 hover:cursor-pointer bg-[#404226]/40 border-yellow-700 text-yellow-500  active:scale-95 active:opacity-80 transition-transform",
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
            isLoggedIn && userInfo && gameStatus?.status === "IN_PROGRESS" && !hasBet &&  (
              <button
                className="border px-6 py-1 border-yellow-700 text-yellow-500 bg-neutral-950 cursor-not-allowed w-full"
                disabled
              >
                Game in progress
              </button>
            )
          }
          {
            isLoggedIn && userInfo && gameStatus?.status === "END" && (
              <button
                className="border border-yellow-700 px-6 py-1 text-yellow-500 bg-neutral-950 cursor-not-allowed w-full"
                disabled
              >
                Game ended
              </button>
            )
          }
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full px-2">
        <AccordionItem value="item-1">
          <AccordionTrigger className="opacity-50">Advanced mode</AccordionTrigger>
          <AccordionContent>
            <div className=" flex flex-col items-start justify-around pt-2 gap-2 w-full">
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
              <div className="flex flex-row items-baseline gap-2 w-full text-lg">
                {
                  (!isLoggedIn || !userInfo) && (
                    <button
                      className="border border-green-700 px-6 py-1 text-green-500 bg-neutral-950 cursor-not-allowed w-full"
                      disabled
                    >
                      Log in to set auto cash out
                    </button>
                  )
                }
                {
                  isLoggedIn && userInfo && (
                    <button
                      className={cn(
                        "border bg-[#404226]/40 border-yellow-700 text-yellow-500 px-6 py-1 w-full",
                        autoCashout && autoCashoutAmount && "bg-[#264234]/40 border-green-700 text-green-500 ",
                        !(parseFloat(autoCashoutAmount) > 0) && "bg-neutral-950",
                        (parseFloat(autoCashoutAmount) > 0) && " active:scale-95 active:opacity-80 transition-transform",
                      )}
                      onClick={() => {
                        if (!autoCashoutAmount || parseFloat(autoCashoutAmount) <= 0){
                          return 
                        }
                        setAutoCashout(!autoCashout);
                  
                      }}
                    >
                      {
                        autoCashout ? "Turn off auto cashout" : parseFloat(autoCashoutAmount) > 0 ? "Turn on auto cashout" : "Enter auto cashout amount"
                      }
                    </button>
                  )
                }
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>


      

    </div>
  );
}