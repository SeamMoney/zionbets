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

export default function GameScreen() {
  const {
    gameStatus,
  } = useContext(gameStatusContext);
  const [update, setUpdate] = useState(true);

  // useEffect(() => {
  //   socket.on("disconnect", () => {
  //     console.log("DISCONNECTED - gameScreen.tsx"); 
  //   });

  //   socket.on(SOCKET_EVENTS.ROUND_START, (data: RoundStart) => {
  //     setUpdate(true);
  //   });

  //   socket.on(SOCKET_EVENTS.ROUND_RESULT, (data: RoundStart) => {
  //     setUpdate(true);
  //   });
  // }, []);

  // useEffect(() => {
  //   if (update) {
  //     getCurrentGame().then((game) => {
        
  //       if (game == null) {
  //         setGameStatus(null);
  //       } else {
  //         if (game.start_time > Date.now()) {
  //           console.log("COUNTDOWN - gameScreen.tsx")
  //           setGameStatus({
  //             status: "COUNTDOWN",
  //             roundId: game.round_id,
  //             startTime: game.start_time,
  //             crashPoint: game.secret_crash_point,
  //           });
  //           setTimeout(() => {
  //             setUpdate(true);
  //           }, game.start_time - Date.now());
  //         } else if (game.start_time + game.secret_crash_point * 1000 > Date.now()) {
  //           console.log("IN_PROGRESS - gameScreen.tsx")
  //           setGameStatus({
  //             status: "IN_PROGRESS",
  //             roundId: game.round_id,
  //             startTime: game.start_time,
  //             crashPoint: game.secret_crash_point,
  //           });
  //           setTimeout(() => {
  //             setUpdate(true);
  //           }, game.start_time + game.secret_crash_point * 1000 - Date.now());
  //         } else {
  //           console.log("END - gameScreen.tsx")
  //           setGameStatus({
  //             status: "END",
  //             roundId: game.round_id,
  //             startTime: game.start_time,
  //             crashPoint: game.secret_crash_point,
  //           });
  //         }
  //       }
  //     });

  //     setUpdate(false);
  //   }
  // }, [update]);

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
    return (
      <div className="border-b border-l border-green-500 h-full w-full bg-neutral-950">
        <CountUp
          start={(Date.now() - gameStatus.startTime!) / 1000}
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
