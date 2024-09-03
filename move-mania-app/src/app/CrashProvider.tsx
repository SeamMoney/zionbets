'use client';

import { User } from "@/lib/schema";
import { GameStatus } from "./controlCenter";
import { ReactNode, createContext, useEffect, useState, useCallback } from "react";
import { socket } from "@/lib/socket";
import { getSession } from "next-auth/react";
import { getCurrentGame, getUser, setUpAndGetUser } from "@/lib/api";
import { SOCKET_EVENTS } from "@/lib/types";
import { EXPONENTIAL_FACTOR, log } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

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
  const [latestAction, setLatestAction] = useState<number | null>(null);
  const [showPWAInstall, setShowPWAInstall] = useState(false);

  const onConnect = useCallback(() => {
    setIsConnected(true);
  }, []);

  const onDisconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  const onRoundStart = useCallback((data: any) => {
    setGameStatus({
      status: "COUNTDOWN",
      roundId: data.gameId,
      startTime: data.startTime,
      crashPoint: data.crashPoint,
    });
    setLatestAction(Date.now());
  }, []);

  const onRoundResult = useCallback((data: any) => {
    setGameStatus({
      status: "END",
      roundId: data.gameId,
      startTime: data.startTime,
      crashPoint: data.crashPoint,
    });
    setLatestAction(Date.now());
  }, []);

  const onBetConfirmed = useCallback(() => {
    setLatestAction(Date.now());
  }, []);

  const onCashOutConfirmed = useCallback(() => {
    setLatestAction(Date.now());
  }, []);

  useEffect(() => {
    getSession().then((session) => {
      if (session && session.user && session.user.email) {
        setUpAndGetUser({
          email: session.user.email,
          username: session.user.name || "",
          image: session.user.image || "",
          referred_by: null,
        }).then((user) => {
          if (user) {
            setAccount(user);
          }
        });
      }
    });

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
  }, [onConnect, onDisconnect, onRoundStart, onBetConfirmed, onCashOutConfirmed, onRoundResult]);

  useEffect(() => {
    if (account && latestAction) {
      const timeoutId = setTimeout(() => {
        getUser(account.email).then((updatedUser) => {
          if (updatedUser) {
            setAccount(updatedUser);
          }
        });
      }, 1000); // Delay API call by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [latestAction, account]);

  useEffect(() => {
    const fetchGameStatus = async () => {
      const game = await getCurrentGame();
      if (game == null) {
        setGameStatus(null);
      } else {
        const now = Date.now();
        const gameEndTime = game.start_time + (game.secret_crash_point == 0 ? 0 : log(EXPONENTIAL_FACTOR, game.secret_crash_point)) * 1000;

        if (game.start_time > now) {
          setGameStatus({
            status: "COUNTDOWN",
            roundId: game.game_id,
            startTime: game.start_time,
            crashPoint: game.secret_crash_point,
          });
        } else if (now < gameEndTime) {
          setGameStatus({
            status: "IN_PROGRESS",
            roundId: game.game_id,
            startTime: game.start_time,
            crashPoint: game.secret_crash_point,
          });
        } else {
          setGameStatus({
            status: "END",
            roundId: game.game_id,
            startTime: game.start_time,
            crashPoint: game.secret_crash_point,
          });
        }
      }
    };

    fetchGameStatus();
    const intervalId = setInterval(fetchGameStatus, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  function isInStandaloneMode() {
    return Boolean(
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || (window.navigator as any).standalone, // Fallback for iOS
    );
  }

  useEffect(() => {
    if (isInStandaloneMode()) {
      console.log('This is running as standalone.');
    } else {
      console.log('This is not running as standalone.');
      setShowPWAInstall(true);
    }
  }, []);

  return (
    <gameStatusContext.Provider
      value={{
        gameStatus,
        account,
        latestAction,
      }}
    >
      {children}
      <AlertDialog open={showPWAInstall && localStorage.getItem("pwaPrompt") != 'true'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add to Phone Home Screen</AlertDialogTitle>
            <AlertDialogDescription>
              For the best experience, add this app to your home screen. <br /><br />
              In your browser&apos;s menu, tap the <b>share</b> icon and choose <b>Add to Home Screen</b> in the options.
              Then open the zion.bet app on your home screen to play.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowPWAInstall(false);
                localStorage.setItem("pwaPrompt", 'true');
              }}
              className="border border-red-700 px-6 py-1 text-red-500 bg-neutral-950 w-full focus:outline-none"
            >I&apos;ll stay in my browser</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </gameStatusContext.Provider>
  );
}