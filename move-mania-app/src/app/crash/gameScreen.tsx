'use client';

import { useEffect, useState } from "react"
import { GameStatus } from "./controlCenter"
import { SOCKET_EVENTS, RoundStart } from "@/lib/types";
import { io } from "socket.io-client";
import CountUp from 'react-countup';


export default function GameScreen() {

  const [gameStatus, setGameStatus] = useState<GameStatus>({
    status: 'lobby',
    roundId: undefined,
    startTime: undefined,
    crashPoint: undefined
  })

  useEffect(() => {
    const newSocket = io("http://localhost:8080");

    newSocket.on("connect", () => console.log("Connected to WebSocket"));
    newSocket.on("disconnect", () =>
      console.log("Disconnected from WebSocket")
    );

    newSocket.on(SOCKET_EVENTS.ROUND_START, (data: RoundStart) => {
      console.log('SOCKET_EVENTS.ROUND_START', data);
      setGameStatus({
        status: 'countdown',
        roundId: data.roundId,
        startTime: data.startTime,
        crashPoint: data.crashPoint
      });

      setTimeout(() => {
        setGameStatus({
          status: 'inProgress',
          roundId: data.roundId,
          startTime: data.startTime,
          crashPoint: data.crashPoint
        });
      }, data.startTime - Date.now());
    });

    newSocket.on(SOCKET_EVENTS.ROUND_RESULT, (data: RoundStart) => {
      console.log('SOCKET_EVENTS.ROUND_RESULT', data);
      setGameStatus({
        status: 'end',
        crashPoint: data.crashPoint
      });
    });

  }, [])

  return (
    <div className="w-full h-full border-l border-b border-green-500">
      Sup
    </div>
  )

  if (gameStatus.status === 'lobby') {
    return (
      <div>
        <span>
          Lobby
        </span>
      </div>
    )
  } else if (gameStatus.status === 'countdown') {
    return (
      <div>
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
        // onEnd={() => console.log('Ended! 👏')}
        // onStart={() => console.log('Started! 💨')}
        />
      </div>
    )
  } else if (gameStatus.status === 'inProgress') {
    return (
      <div>
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
          onEnd={() => console.log('Ended! 👏')}
          onStart={() => console.log('Started! 💨', gameStatus.crashPoint)}
        />
      </div>
    )
  } else if (gameStatus.status === 'end') {
    return (
      <div>
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
            onEnd={() => console.log('Ended! 👏')}
            onStart={() => console.log('Started! 💨', gameStatus.crashPoint)}
          />
        </div>
      </div>
    )
  }
}