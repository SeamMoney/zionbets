'use client';

import { clearGames, getUser, setUpAndGetUser, updateUser } from "@/lib/api";
import { quickRemoveGame } from "@/lib/aptos";
import { User } from "@/lib/schema";
import { startRound } from "@/lib/socket";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

const admins = process.env.ADMIN_ACCOUNTS ? process.env.ADMIN_ACCOUNTS.split("@@@") : [];

export default function AdminPage() {

  const [account, setAccount] = useState<User | null>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        if (!session.user || !session.user.email) return;

        getUser(
          session.user.email
        ).then((user) => {
          if (user) {
            setAccount(user);
          }
        });
      }
    });
  }, []);

  if (!account) return <></>;

  if (!admins.includes(account.email)) {
    window.location.href = "/";
  }

  const onStartRound = async () => {
    console.log('startRound')

    const success = startRound();

    if (!success) {
      console.error("Failed to start round");
    } else {
      console.log("Started round");
    }
  };

  const onClearGames = async () => {
    console.log('clearGames')

    const success = await clearGames();

    if (!success) {
      console.error("Failed to clear games");
    } else {
      console.log("Cleared games");
    }
  }

  const onQuickRemoveGame = async () => {
    console.log('quickRemoveGame')

    const txn = await quickRemoveGame();

    if (!txn) {
      console.error("Failed to clear games");
    } else {
      console.log("Cleared games");
    }
  }

  return ( 
    <div className="flex flex-col">
      <span>Hello, {account.email}</span>
      <div className="flex flex-col">
        <span>Admin emails: </span>
        {
          admins.map((admin) => (
            <span key={admin}>{admin}</span>
          ))
        
        }
      </div>
      <button onClick={onQuickRemoveGame}>
        Quick remove game (contract)
      </button>
      <button onClick={onClearGames}>
        clear games
      </button>
      <button onClick={onStartRound}>
        start game
      </button>
    </div>
  )
}