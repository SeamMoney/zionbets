'use client';

import { User } from "@/lib/schema";
import { GameStatus } from "./controlCenter";
import { ReactNode, createContext, useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { getSession } from "next-auth/react";
import { getCurrentGame, setUpAndGetUser } from "@/lib/api";
import { SOCKET_EVENTS } from "@/lib/types";

interface CrashPageProps {
  gameStatus: GameStatus | null;
  account: User | null;
  latestAction: number | null;
}
export const gameStatusContext = createContext<CrashPageProps>({
  gameStatus: null, 
  account: null,
  latestAction: null,
});

export default function CrashProvider({ children }: { children: ReactNode }) {

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [account, setAccount] = useState<User | null>(null);
  const [update, setUpdate] = useState(true);
  const [latestAction, setLatestAction] = useState<number | null>(null);

  useEffect(() => {

    getSession().then((session) => {
      if (session) {
        if (!session.user) return;

        setUpAndGetUser({
          username: session.user.name || "",
          image: session.user.image || "",
          email: session.user.email || "",
        }).then((user) => {
          if (user) {
            setAccount(user);
          }
        });
      }
    });

    function onConnect() {
      console.log('Connected', socket.connected)
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log('Disconnected', socket.connected)
      setIsConnected(false);
    }

    function onRoundStart() {
      console.log('Round Start')
      setUpdate(true);
      setLatestAction(Date.now());
    }

    function onRoundResult() {
      console.log('Round Result')
      setLatestAction(Date.now());
    }

    function onBetConfirmed() {
      console.log('Bet Confirmed')
      setLatestAction(Date.now());
    }

    function onCashOutConfirmed() {
      console.log('Cash Out Confirmed')
      setLatestAction(Date.now());
    }

    // function onFooEvent(value) {
    //   // setFooEvents(previous => [...previous, value]);
    // }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SOCKET_EVENTS.ROUND_START, onRoundStart);
    socket.on(SOCKET_EVENTS.BET_CONFIRMED, onBetConfirmed);
    socket.on(SOCKET_EVENTS.CASH_OUT_CONFIRMED, onCashOutConfirmed);
    socket.on(SOCKET_EVENTS.ROUND_RESULT, onRoundResult);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SOCKET_EVENTS.ROUND_START, onRoundStart);
      socket.off(SOCKET_EVENTS.BET_CONFIRMED, onBetConfirmed);
      socket.off(SOCKET_EVENTS.CASH_OUT_CONFIRMED, onCashOutConfirmed);
      socket.off(SOCKET_EVENTS.ROUND_RESULT, onRoundResult); 
    };
  }, []);

  useEffect(() => {

    if (update) {
      getCurrentGame().then((game) => {
        console.log("game", game)
        if (game == null) {
          setGameStatus(null);
        } else {
          if (game.start_time > Date.now()) {
            console.log("COUNTDOWN - page.tsx")
            setGameStatus({
              status: "COUNTDOWN",
              roundId: game.round_id,
              startTime: game.start_time,
              crashPoint: game.secret_crash_point,
            });
            setTimeout(() => {
              setUpdate(true);
            }, game.start_time - Date.now());
          } else if (game.start_time + (game.secret_crash_point == 0 ? 0 : game.secret_crash_point - 1) * 1000 > Date.now()) {
            console.log("IN_PROGRESS - page.tsx")
            setGameStatus({
              status: "IN_PROGRESS",
              roundId: game.round_id,
              startTime: game.start_time,
              crashPoint: game.secret_crash_point,
            });
            setTimeout(() => {
              setUpdate(true);
            }, game.start_time + (game.secret_crash_point == 0 ? 0 : game.secret_crash_point - 1) * 1000 - Date.now());
          } else {
            console.log("END - page.tsx")
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

  return (
    <gameStatusContext.Provider
      value={{
        gameStatus,
        account,
        latestAction,
      }}
    >
      {children}
    </gameStatusContext.Provider>
  );
}