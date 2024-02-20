"use client";
import { useEffect, useState, createContext, ReactNode } from "react";
import { getSession } from "next-auth/react";
import { getCurrentGame, setUpAndGetUser } from "@/lib/api";
import { socket } from "@/lib/socket";
import { User } from "@/lib/schema";
import { GameStatus } from "./controlCenter";
import { SOCKET_EVENTS } from "@/lib/types";

interface CrashPageProps {
  gameStatus: GameStatus | null;
  account: User | null;
  latestAction: number | null;
  fetchAndSetGameStatus: () => void;
  startCountdownManually: (status: string) => void;
}

export const gameStatusContext = createContext<CrashPageProps>({
  gameStatus: null,
  account: null,
  latestAction: null,
  fetchAndSetGameStatus: () => { },
  startCountdownManually: () => { },
});

export default function CrashProvider({ children }: { children: ReactNode }) {
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [account, setAccount] = useState<User | null>(null);

  const startCountdownManually = (status: string) => {
    if (status === "COUNTDOWN") {
      const manualStartTime = new Date();
      manualStartTime.setSeconds(manualStartTime.getSeconds() + 10);
      setGameStatus({
        status: "COUNTDOWN",
        startTime: manualStartTime.getTime(),
        roundId: 0,
        crashPoint: 0,
      });
    } else if (status === "IN_PROGRESS") {
      setGameStatus(currentStatus => {

        if (currentStatus === null) {
          return null;
        }
        return {
          ...currentStatus,
          status: "IN_PROGRESS",
          roundId: currentStatus.roundId,
          startTime: currentStatus.startTime,
          crashPoint: currentStatus.crashPoint,
        };
      });
    }
  };

  const fetchAndSetGameStatus = async () => {
    const game = await getCurrentGame();

    if (!game) return;

    const now = Date.now();
    const startTime = new Date(game.start_time).getTime();
    const duration = game.secret_crash_point * 1000;
    const endTime = startTime + duration;

    if (now < startTime) {
      setGameStatus({
        status: "COUNTDOWN",
        roundId: game.round_id,
        startTime: game.start_time,
        crashPoint: game.secret_crash_point,
      });
    } else if (now >= startTime && now <= endTime) {
      setGameStatus({
        status: "IN_PROGRESS",
        roundId: game.round_id,
        startTime: game.start_time,
        crashPoint: game.secret_crash_point,
      });
    } else {
      setGameStatus({
        status: "END",
        roundId: game.round_id,
        startTime: game.start_time,
        crashPoint: game.secret_crash_point,
      });
    }
  };

  useEffect(() => {
    fetchAndSetGameStatus().catch(console.error);
  }, []);

  useEffect(() => {
    const eventHandlers = {
      [SOCKET_EVENTS.ROUND_START]: fetchAndSetGameStatus,
      [SOCKET_EVENTS.BET_CONFIRMED]: fetchAndSetGameStatus,
      [SOCKET_EVENTS.CASH_OUT_CONFIRMED]: fetchAndSetGameStatus,
      [SOCKET_EVENTS.ROUND_RESULT]: fetchAndSetGameStatus,
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.keys(eventHandlers).forEach(event => {
        socket.off(event, eventHandlers[event]);
      });
    };
  }, []);

  useEffect(() => {
    getSession().then(session => {
      if (session?.user) {
        setUpAndGetUser({
          username: session.user.name || "",
          image: session.user.image || "",
          email: session.user.email || "",
        }).then(user => {
          if (user) setAccount(user);
        });
      }
    });
  }, []);

  return (
    <gameStatusContext.Provider value={{ gameStatus, account, latestAction: Date.now(), fetchAndSetGameStatus, startCountdownManually }}>
      {children}
    </gameStatusContext.Provider>
  );
}