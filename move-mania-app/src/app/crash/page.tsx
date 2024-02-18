'use client';

import CrashChart from "@/components/CrashChart.client";
import ChatWindow from "./chatWindow";
import ControlCenter, { GameStatus } from "./controlCenter";
import GameScreen from "./gameScreen";
import PlayerList from "./playerList";

import { socket } from "@/lib/socket";
import { createContext, useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { setUpAndGetUser, getCurrentGame } from "@/lib/api";
import { User } from "@/lib/schema";
import { SOCKET_EVENTS } from "@/lib/types";

export interface CrashPageProps {
  gameStatus: GameStatus | null;
  account: User | null;
  latestAction: number | null;
}
export const gameStatusContext = createContext<CrashPageProps>({
  gameStatus: null, 
  account: null,
  latestAction: null,
});

export default function CrashPage() {

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
          } else if (game.start_time + game.secret_crash_point * 1000 > Date.now()) {
            console.log("IN_PROGRESS - page.tsx")
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

  if (!isConnected) {
    return (
      <div className="bg-[#020202] text-white flex flex-col items-center px-2 gap-2 py-4 bg-noise">
        <div className="flex flex-row items-start w-full h-[700px] gap-2 ">
          <div className=" w-[75%] flex flex-col items-center gap-2 h-full border border-neutral-700 p-2">
            <div className="h-full w-full p-4">
              <h1>Connecting...</h1>
            </div>
          </div>
          <div className="h-full w-full max-w-[400px]">
            <PlayerList />
          </div>
        </div>
        <div className="border border-neutral-700 p-2 w-full h-[800px]"></div>
      </div>
    );
  }

  return (
    <gameStatusContext.Provider 
      value={{
        gameStatus,
        account,
        latestAction,
      }}
    >
      <div className="bg-[#020202] text-white flex flex-col items-center px-2 gap-2 py-4 bg-noise">
        <div className="flex flex-row items-start w-full h-[700px] gap-2 ">
          <div className=" w-[75%] flex flex-col items-center gap-2 h-full border border-neutral-700 p-2">
            <div className="h-full w-full p-4">
              <GameScreen />
            </div>
            <div className="max-h-[150px] h-full w-full">
              <ControlCenter />
            </div>
          </div>
          <div className="h-full w-full max-w-[400px]">
            <PlayerList />
          </div>
        </div>
        <div className="border border-neutral-700 p-2 w-full h-[800px]"></div>
      </div>
    </gameStatusContext.Provider>
  );
}
