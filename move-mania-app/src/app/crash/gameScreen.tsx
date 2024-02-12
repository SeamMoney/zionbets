'use client';

import { useEffect, useState } from "react"
import { GameStatus } from "./controlCenter"
import { SOCKET_EVENTS, RoundStart } from "@/lib/types";
import { io } from "socket.io-client";
import CountUp from 'react-countup';
import { getCurrentGame } from "@/lib/api";


export default function GameScreen() {

  const [gameStatus, setGameStatus] = useState<GameStatus>({
    status: 'lobby',
    roundId: undefined,
    startTime: undefined,
    crashPoint: undefined
  })
  const [update, setUpdate] = useState(true);

  useEffect(() => {
    const newSocket = io("http://localhost:8080");

    newSocket.on("connect", () => console.log("Connected to WebSocket"));
    newSocket.on("disconnect", () =>
      console.log("Disconnected from WebSocket")
    );

    newSocket.on(SOCKET_EVENTS.ROUND_START, (data: RoundStart) => {
      console.log('SOCKET_EVENTS.ROUND_START', data);
      setUpdate(true);

      setTimeout(() => {
        setUpdate(true);
      }, data.startTime - Date.now());
    });

    newSocket.on(SOCKET_EVENTS.ROUND_RESULT, (data: RoundStart) => {
      console.log('SOCKET_EVENTS.ROUND_RESULT', data);
      setUpdate(true);
    });

  }, [])

  useEffect(() => {
    if (update) {
      getCurrentGame().then((game) => {
        console.log('getCurrentGame', game);
        if (game == null) {
          setGameStatus({
            status: 'lobby',
          })
        } else {
          setGameStatus({
            status: game.status,
            roundId: game.game_id,
            startTime: game.start_time,
            crashPoint: game.secret_crash_point
          })
        }
      });
      setUpdate(false);
    }
  }, [update])

  if (gameStatus.status === 'lobby') {
    return (
      <div>
        <span>
          Lobby
        </span>
      </div>
    )
  } else if (gameStatus.startTime && gameStatus.startTime > Date.now()) {
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
  } else if (gameStatus.status === 'IN_PROGRESS') {
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
  } else if (gameStatus.status === 'END') {
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