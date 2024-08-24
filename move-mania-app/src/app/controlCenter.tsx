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
import { cashOutBet, setNewBet } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/types";
import { EXPONENTIAL_FACTOR, calculateCurrentCrashPoint, cn, log } from "@/lib/utils";
import { useCallback, useContext, useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { gameStatusContext } from "./CrashProvider";
import { cashOut, placeBet } from "@/lib/aptos";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

export type GameStatus = {
  status: "COUNTDOWN" | "IN_PROGRESS" | "END";
  roundId: string;
  startTime: number;
  crashPoint: number;
};

export default function ControlCenter() {
  const {
    gameStatus,
    account,
    latestAction
  } = useContext(gameStatusContext);

  const { toast } = useToast()

  const [betAmount, setBetAmount] = useState("");
  const [autoCashout, setAutoCashout] = useState(false);
  const [autoCashoutAmount, setAutoCashoutAmount] = useState("");
  const [hasBet, setHasBet] = useState(false);
  const [hasCashOut, setHasCashOut] = useState(false);
  const [betPlacedThisRound, setBetPlacedThisRound] = useState(false);

  useEffect(() => {
    console.log("Game Status:", gameStatus);
    console.log("Has Bet:", hasBet);
    console.log("Has Cash Out:", hasCashOut);
    console.log("Bet Placed This Round:", betPlacedThisRound);

    if (gameStatus?.status === "COUNTDOWN") {
      setBetPlacedThisRound(false);
    }

    if (account) {
      hasUserBet(account.public_address).then((bet) => {
        console.log("API Has Bet:", bet);
        setHasBet(bet);
        if (bet) {
          setBetPlacedThisRound(true);
        }
      });

      hasUserCashOut(account.public_address).then((cashout) => {
        console.log("API Has Cash Out:", cashout);
        setHasCashOut(cashout);
      });
    }
  }, [gameStatus, account, latestAction]);

  const onCashOut = useCallback(async () => {
    if (!socket || !account || !gameStatus?.startTime) return;

    const cashoutMultipler = Number(calculateCurrentCrashPoint((Date.now() - gameStatus.startTime) / 1000).toFixed(2));

    toast({
      title: "Cashing out at " + cashoutMultipler + "x...",
    })

    try {
      const blockchainRes = await cashOut(account.private_key, {
        roundId: parseInt(gameStatus.roundId),
        playerEmail: account.email,
        cashOutMultiplier: cashoutMultipler,
      });

      if (!blockchainRes) {
        throw new Error('Error cashing out');
      }

      const data = {
        roundId: parseInt(gameStatus.roundId),
        playerEmail: account.email,
        cashOutMultiplier: cashoutMultipler,
      };
      cashOutBet(data);

      toast({
        title: "Cashed out at " + cashoutMultipler + "x",
        description: <Link href={`https://explorer.aptoslabs.com/txn/${blockchainRes.txnHash}/?network=testnet`} target="_blank" className="underline">View transaction</Link>
      })
      setHasCashOut(true);
    } catch (error) {
      console.error('Error cashing out:', error);
      toast({
        title: "Error cashing out",
        description: "Please try again"
      })
    }
  }, [account, gameStatus, toast]);


  const checkAutoCashout = useCallback(() => {
    const timeUntilCrash = gameStatus?.startTime! + log(EXPONENTIAL_FACTOR, gameStatus?.crashPoint!) * 1000 - Date.now();
    const timeUntilCashout = gameStatus?.startTime! + log(EXPONENTIAL_FACTOR, parseFloat(autoCashoutAmount)!) * 1000 - Date.now();
    if (hasBet && autoCashout && timeUntilCashout < timeUntilCrash && timeUntilCashout > 0) {
      setTimeout(() => {
        onCashOut();
      }, timeUntilCashout);
    }
  }, [gameStatus, autoCashout, autoCashoutAmount, hasBet, onCashOut]);

  useEffect(() => {
    if (gameStatus?.status === "IN_PROGRESS") {
      checkAutoCashout();
    }
  }, [gameStatus, checkAutoCashout]);

  const onSetBet = useCallback(async () => {
    if (!socket || !account || !gameStatus) return;

    toast({
      title: "Placing bet at " + betAmount + " ZAPT...",
    })

    try {
      const blockchainRes = await placeBet(account.private_key, {
        roundId: parseInt(gameStatus.roundId),
        playerEmail: account.email,
        betAmount: parseFloat(betAmount),
        coinType: "ZAPT",
      });

      if (!blockchainRes) {
        throw new Error('Error placing bet');
      }

      const data = {
        roundId: parseInt(gameStatus.roundId),
        playerEmail: account.email,
        betAmount: parseFloat(betAmount),
        coinType: "ZAPT",
      };
      setNewBet(data);

      toast({
        title: "Bet placed at " + betAmount + " ZAPT",
        description: <Link href={`https://explorer.aptoslabs.com/txn/${blockchainRes.txnHash}/?network=testnet`} target="_blank" className="underline">View transaction</Link>
      })
      setHasBet(true);
      setBetPlacedThisRound(true);
    } catch (error) {
      console.error('Error placing bet:', error);
      toast({
        title: "Error placing bet",
        description: "Please try again"
      })
    }
  }, [account, gameStatus, betAmount, toast, setNewBet, setHasBet]);



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
              <span>ZAPT</span>
            </span>
          </div>
          <div className="flex flex-row items-center text-xs w-full">
            <div
              className={`border px-2 py-1 cursor-pointer grow text-center ${parseFloat(betAmount) === 1
                ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                : "opacity-50 border-neutral-700"
                }`}
              onClick={() => setBetAmount("1")}
            >
              1 ZAPT
            </div>
            <div
              className={`border px-2 py-1 cursor-pointer grow text-center ${parseFloat(betAmount) === 5
                ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                : "opacity-50 border-neutral-700"
                }`}
              onClick={() => setBetAmount("5")}
            >
              5 ZAPT
            </div>
            <div
              className={`border px-2 py-1 cursor-pointer grow text-center ${parseFloat(betAmount) === 10
                ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                : "opacity-50 border-neutral-700"
                }`}
              onClick={() => setBetAmount("10")}
            >
              10 ZAPT
            </div>
            <div
              className={`border px-2 py-1 cursor-pointer grow text-center ${parseFloat(betAmount) === 25
                ? "border border-green-700 bg-[#264234]/60 bg-noise text-green-500"
                : "opacity-50 border-neutral-700"
                }`}
              onClick={() => setBetAmount("25")}
            >
              25 ZAPT
            </div>
          </div>
        </div>
        <div className="flex flex-row items-baseline gap-2 w-full text-lg">
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
                  "border border-green-700 px-6 py-1 border-yellow-700 text-yellow-500 bg-neutral-950 w-full",
                  !betPlacedThisRound
                    ? "cursor-not-allowed"
                    : "bg-[#264234]/40 hover:cursor-pointer border-green-700 text-green-500",
                  (parseFloat(betAmount) > 0) && !betPlacedThisRound && "bg-[#404226]/40 active:scale-95 active:opacity-80 transition-transform",
                )}
                onClick={onSetBet}
                disabled={!(parseFloat(betAmount) > 0) || betPlacedThisRound}
              >
                {
                  betPlacedThisRound ? "Bet placed" : (parseFloat(betAmount) > 0) ? "Place bet" : "Enter bet amount"
                }
              </button>
            )
          }
          {
            account && gameStatus?.status === "IN_PROGRESS" && betPlacedThisRound && (
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
            account && gameStatus?.status === "IN_PROGRESS" && !betPlacedThisRound && (
              <button
                className="border px-6 py-1 border-yellow-700 text-yellow-500 bg-neutral-950 cursor-not-allowed w-full"
                disabled
              >
                Game in progress
              </button>
            )
          }
          {
            account && gameStatus?.status === "END" && (
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
                    className={`text-center border px-2 py-1 cursor-pointer grow ${parseFloat(autoCashoutAmount) === 1.01
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
                    className={`text-center border px-2 py-1 cursor-pointer grow ${parseFloat(autoCashoutAmount) === 1.5
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
                    className={`text-center border px-2 py-1 cursor-pointer grow ${parseFloat(autoCashoutAmount) === 2
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
                    className={`text-center border px-2 py-1 cursor-pointer grow ${parseFloat(autoCashoutAmount) === 5
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
                        "border bg-[#404226]/40 border-yellow-700 text-yellow-500 px-6 py-1 w-full",
                        autoCashout && autoCashoutAmount && "bg-[#264234]/40 border-green-700 text-green-500 ",
                        !(parseFloat(autoCashoutAmount) > 0) && "bg-neutral-950",
                        (parseFloat(autoCashoutAmount) > 0) && " active:scale-95 active:opacity-80 transition-transform",
                      )}
                      onClick={() => {
                        if (!autoCashoutAmount || parseFloat(autoCashoutAmount) <= 0) {
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