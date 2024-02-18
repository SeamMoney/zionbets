"use client";

import { useEffect, useState } from "react";
import { GameStatus } from "./controlCenter";
import { SOCKET_EVENTS, RoundStart } from "@/lib/types";
import { io } from "socket.io-client";
import CountUp from "react-countup";
import { getCurrentGame } from "@/lib/api";

export default function GameScreen() {
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [update, setUpdate] = useState(true);

  useEffect(() => {
    const newSocket = io("http://localhost:8080");

    newSocket.on(SOCKET_EVENTS.ROUND_START, (data: RoundStart) => {
      setUpdate(true);
    });
  }, []);

  useEffect(() => {
    if (update) {
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
  }, [update]);

  if (gameStatus === null) {
    return (
      <div className="border-b border-l border-green-500 h-full w-full bg-neutral-950">
        <span>No games yet - admin start one</span>
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
    return (
      <div className="border-b border-l border-green-500 h-full w-full bg-neutral-950">
        <CountUp
          start={0}
          end={gameStatus.crashPoint!}
          duration={gameStatus.crashPoint!}
          separator=""
          decimals={2}
          decimal="."
          prefix=""
          suffix="x"
          useEasing={false}
        />
      </div>
    );
  } else if (gameStatus.status === "END") {
    return (
      <div className="border-b border-l border-green-500 h-full w-full bg-neutral-950">
        <div>
          <CountUp
            start={gameStatus.crashPoint!}
            end={gameStatus.crashPoint!}
            duration={0}
            separator=""
            decimals={2}
            decimal="."
            prefix=""
            suffix="x"
            useEasing={false}
          />
        </div>
      </div>
    );
  }
}
