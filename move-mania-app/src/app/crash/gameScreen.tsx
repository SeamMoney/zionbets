"use client";

import { useContext, useEffect, useState } from "react";
import { GameStatus } from "./controlCenter";
import { SOCKET_EVENTS, RoundStart } from "@/lib/types";
import { Socket, io } from "socket.io-client";
import CountUp from "react-countup";
import { getCurrentGame } from "@/lib/api";
import { startRound } from "@/lib/socket";

import { socket } from "@/lib/socket";

import { gameStatusContext } from "./CrashProvider";
import CrashChart from "@/components/CrashChart.client";

export default function GameScreen() {
  const {
    gameStatus,
  } = useContext(gameStatusContext);
  const [update, setUpdate] = useState(true);

  const onStartRound = () => {
    if (!socket) return;

    const success = startRound();
  };

  if (gameStatus === null) {
    return (
      <div className="border-b border-l border-green-500 h-full w-full bg-neutral-950">
        <span onClick={onStartRound}>No games yet - click here to admin start one</span>
      </div>
    );
  } else if (gameStatus.status === "COUNTDOWN") {
    return (
      <div className="border-b border-l border-green-500 h-full w-full bg-neutral-950">
        <CountUp
          start={(gameStatus.startTime! - Date.now()) / 1000}
          end={0}
          duration={(gameStatus.startTime! - Date.now()) / 1000}
          separator=" "
          decimals={0}
          decimal="."
          prefix="Game starts in "
          suffix=" seconds"
          useEasing={false}
        />
      </div>
    );
  } else if (gameStatus.status === "IN_PROGRESS") {
    const hardcodedCrashPoint = 5000;
    console.log("Current gameStatus:", gameStatus);
    return (
      <CrashChart startAnimation={true} crashPoint={gameStatus.crashPoint} />
    );
  } else if (gameStatus.status === "END") {
    return (
      <div className="border-b border-l border-green-500 h-full w-full bg-neutral-950">
        <CrashChart startAnimation={false} crashPoint={gameStatus.crashPoint} />
      </div>
    );
  }
}