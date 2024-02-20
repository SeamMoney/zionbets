"use client";
import React, { useContext, useEffect, useState } from "react";
import moment from "moment";
import { gameStatusContext } from "./CrashProvider";
import CrashChart from "@/components/CrashChart.client";

export default function GameScreen() {
  const { gameStatus, startCountdownManually } = useContext(gameStatusContext);
  const [countdown, setCountdown] = useState({ seconds: '' });

  useEffect(() => {
    if (!gameStatus || gameStatus.status !== "COUNTDOWN") {
      return;
    }

    const endTime = moment(gameStatus.startTime);
    const updateCountdown = () => {
      const now = moment();
      const duration = moment.duration(endTime.diff(now));
      const seconds = Math.ceil(duration.asSeconds());

      if (seconds <= 0) {
        startCountdownManually("IN_PROGRESS");
        return;
      }

      setCountdown({ seconds: seconds.toString() });
    };

    const intervalId = setInterval(updateCountdown, 1000);
    updateCountdown();

    return () => clearInterval(intervalId);
  }, [gameStatus]);

  if (gameStatus === null) {
    return (
      <div>
        <button onClick={() => startCountdownManually("COUNTDOWN")}>Start Button</button>
      </div>
    );
  } else if (gameStatus.status === "COUNTDOWN") {
    return (
      <div>
        <h1>Countdown</h1>
        <div>
          {countdown.seconds} Seconds until the next game starts.
        </div>
        <button onClick={() => startCountdownManually("COUNTDOWN")}>Restart Countdown Manually</button>
      </div>
    );
  } else if (gameStatus.status === "IN_PROGRESS") {
    // Hardcoded crashPoint
    const hardcodedCrashPoint = 5000;
    console.log("Current gameStatus:", gameStatus);
    return (
      <CrashChart key={`crash-chart-${gameStatus.status}`} startAnimation={true} crashPoint={hardcodedCrashPoint} />
    );
  } else if (gameStatus.status === "END") {
    return (
      <CrashChart startAnimation={false} crashPoint={gameStatus.crashPoint} />
    );
  }
}