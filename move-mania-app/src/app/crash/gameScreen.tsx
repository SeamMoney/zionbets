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
import CandlestickChart from "@/components/CandlestickChart.client";
import { generateChartData } from "@/lib/utils";

export default function GameScreen() {
  const {
    gameStatus,
  } = useContext(gameStatusContext);

  const onStartRound = () => {
    if (!socket) return;

    const success = startRound();
  };

  if (gameStatus === null) {
    return (
      <div className=" h-full w-full bg-neutral-950">
        <span onClick={onStartRound}>No games yet - click here to admin start one</span>
      </div>
    );
  } else if (gameStatus.status === "COUNTDOWN") {
    return (
      <div className=" w-full -mt-8">
        <CountUp
          className="relative z-10 top-8 left-5 text-green-500 text-xl"
          start={(gameStatus.startTime! - Date.now()) / 1000}
          end={0}
          duration={(gameStatus.startTime! - Date.now()) / 1000}
          separator=" "
          decimals={0}
          decimal="."
          prefix="Bull run in "
          suffix=" seconds"
          useEasing={false}
        />
        <CandlestickChart startTime={gameStatus.startTime!} crashPoint={gameStatus.crashPoint} data={generateChartData(gameStatus.roundId, gameStatus.crashPoint)} />
      </div>
    );
  } else if (gameStatus.status === "IN_PROGRESS") {
    return (
      <div className=" w-full -mt-8">
        <div>
          <CountUp
            className="relative z-10 top-8 left-5 text-green-500 text-xl"
            start={(Date.now() - gameStatus.startTime!) / 1000 + 1}
            end={gameStatus.crashPoint!}
            duration={gameStatus.crashPoint! - ((Date.now() - gameStatus.startTime!) / 1000 + 1)}
            separator=""
            decimals={2}
            decimal="."
            prefix="Your portfolio is up: "
            suffix="x"
            useEasing={false}
          />
          <CandlestickChart startTime={gameStatus.startTime!} crashPoint={gameStatus.crashPoint} data={generateChartData(gameStatus.roundId, gameStatus.crashPoint)} />
        </div>
      </div>
    );
  } else if (gameStatus.status === "END") {
    return (
      <div className=" w-full -mt-8">
        <div>
          <CountUp
          className="relative z-10 top-8 left-5 text-green-500 text-xl"
            start={gameStatus.crashPoint!}
            end={gameStatus.crashPoint!}
            duration={0}
            separator=""
            decimals={2}
            decimal="."
            prefix="Rugged! All time high: "
            suffix="x"
            useEasing={false}
          />
          <CandlestickChart startTime={gameStatus.startTime!} crashPoint={gameStatus.crashPoint} data={generateChartData(gameStatus.roundId, gameStatus.crashPoint)} />
        </div>
      </div>
    );
  }
}