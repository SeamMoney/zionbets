"use client";

import { useContext, useEffect, useState } from "react";
import { GameStatus } from "./controlCenter";
import { SOCKET_EVENTS, RoundStart } from "@/lib/types";
import { Socket, io } from "socket.io-client";
import { getCurrentGame } from "@/lib/api";
import { startRound } from "@/lib/socket";
import CountUp from "react-countup";

import { socket } from "@/lib/socket";

import { gameStatusContext } from "./CrashProvider";
import CandlestickChart from "@/components/CandlestickChart.client";
import { calculateCurrentCrashPoint, generateChartData, generateLineChartData } from "@/lib/utils";
import "@/app/customCountdown.css";

export default function GameScreen() {
  const {
    gameStatus,
  } = useContext(gameStatusContext);

  const onStartRound = () => {
    if (!socket) return;

    const success = startRound();
  };

  const [currentMultiplier, setCurrentMultiplier] = useState(1);

  useEffect(() => {
    if (gameStatus?.status === "IN_PROGRESS") {
      const interval = setInterval(() => {
        const elapsedTime = (Date.now() - gameStatus.startTime!) / 1000;
        const multiplier = calculateCurrentCrashPoint(elapsedTime);
        setCurrentMultiplier(multiplier);
      }, 10);

      return () => clearInterval(interval);
    }
  }, [gameStatus]);

  useEffect(() => {
    const template = document.querySelector("#clocknumbers");

    document.querySelectorAll('ul').forEach((n, i) => {
      const clone = template.content.cloneNode(true);
      n.appendChild(clone);
    });

    let countdown = 15;

    const update = function () {
      const seconds = countdown % 60;

      document.body.style.setProperty('--seconds-p', Math.floor(seconds / 10));
      document.body.style.setProperty('--seconds-a', seconds % 10);

      if (countdown > 0) {
        countdown--;
      } else {
        countdown = 15;
      }

      setTimeout(update, 1000); // Update every second
    }

    update();
  }, []);

  if (gameStatus === null) {
    return (
      <div className=" h-full w-full bg-neutral-950">
        <span onClick={onStartRound}>No games yet - click here to admin start one</span>
      </div>
    );
  } else if (gameStatus.status === "COUNTDOWN") {
    return (
      <div className=" w-full -mt-10">
        <main>
          <ul className="s-p"></ul>
          <ul className="s-a"></ul>
        </main>
        <template id="clocknumbers">
          <li>0</li>
          <li>1</li>
          <li>2</li>
          <li>3</li>
          <li>4</li>
          <li>5</li>
          <li>6</li>
          <li>7</li>
          <li>8</li>
          <li>9</li>
        </template>
        <CandlestickChart startTime={gameStatus.startTime!} crashPoint={gameStatus.crashPoint} data={generateChartData(gameStatus.roundId, gameStatus.crashPoint)} linedata={generateLineChartData(gameStatus.roundId, gameStatus.crashPoint)} />
      </div>
    );
  } else if (gameStatus.status === "IN_PROGRESS") {
    return (
      <div className=" w-full -mt-10">
        <div>
          <span className="relative z-10 top-12 left-5 text-green-500 text-4xl tracking-base">{currentMultiplier.toFixed(2)}x</span>
          <CandlestickChart startTime={gameStatus.startTime!} crashPoint={gameStatus.crashPoint} data={generateChartData(gameStatus.roundId, gameStatus.crashPoint)} linedata={generateLineChartData(gameStatus.roundId, gameStatus.crashPoint)} />
        </div>
      </div>
    );
  } else if (gameStatus.status === "END") {
    return (
      <div className=" w-full -mt-10">
        <div>
          <CountUp
            className="relative z-10 top-12 left-5 text-green-500 text-4xl"
            start={gameStatus.crashPoint!}
            end={gameStatus.crashPoint!}
            duration={0}
            separator=""
            decimals={2}
            decimal="."
            prefix="Crashed at "
            suffix="x"
            useEasing={false}
          />
          <CandlestickChart startTime={gameStatus.startTime!} crashPoint={gameStatus.crashPoint} data={generateChartData(gameStatus.roundId, gameStatus.crashPoint)} linedata={generateLineChartData(gameStatus.roundId, gameStatus.crashPoint)} />
        </div>
      </div>
    );
  }
}