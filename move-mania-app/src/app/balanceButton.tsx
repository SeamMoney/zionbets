"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  doesUserExist,
  getUser,
  setUpAndGetUser,
  setUpUser,
  updateUser,
} from "@/lib/api";
import { User } from "@/lib/schema";
import { Clipboard, EyeIcon, EyeOffIcon } from "lucide-react";
import { getSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function BalanceButton() {
  const [account, setAccount] = useState<User | null>(null);

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
  }, []);

  const onWithdraw = async () => {
    // withdraw funds
  }


  if (account) {
    return (
      <Dialog>
      <DialogTrigger asChild>
        <button className="bg-neutral-800 hover:bg-neutral-700 px-6 py-2 font-mono text-white font-semibold">
          {account.balance.toFixed(2)} APT
        </button>
      </DialogTrigger>
      <DialogContent>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
            Send APT to the public address below to deposit funds into your account.
          </DialogDescription>
          <div className="border border-neutral-700 flex flex-row justify-between px-4 py-2">
            <label
              htmlFor="public_address"
              className="text-left font-mono"
            >
              Public address
            </label>
            <span className="font-mono opacity-50 flex flex-row justify-center items-center gap-1">
              <input
                id="public_address"
                disabled
                value={account.public_address}
                className="bg-transparent border-none outline-none text-right text-ellipsis cursor-not-allowed"
              />
              <Clipboard className="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100" onClick={() => {
                // copy public address to clipboard
                navigator.clipboard.writeText(account.public_address);
              }} />
            </span>
          </div>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Withdraw APT from your account to the address specified below.
          </DialogDescription>
          <div className="flex flex-col w-full items-end w-full gap-2">
            <div className="border border-neutral-700 flex flex-row justify-between px-4 py-2 w-full">
              <label
                htmlFor="public_address"
                className="text-left font-mono"
              >
                Recipient address
              </label>
              <span className="font-mono opacity-50 flex flex-row justify-center items-center gap-1">
                <input
                  id="public_address"
                  placeholder={account.public_address}
                  className="bg-transparent border-none outline-none text-right text-ellipsis"
                />
              </span>
            </div>
            <button onClick={onWithdraw} className="bg-green-500 text-neutral-950 px-6 py-2 hover:bg-green-600">
              Withdraw
            </button>
          </div>
      </DialogContent>
    </Dialog>
    )
  } else {
    return null;
  }
}
