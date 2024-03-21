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
import { useContext, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link";
import { getBalance, transferCoin } from "@/lib/aptos";
import { cn } from "@/lib/utils";
import { magicContext } from "./MagicProvider";


export default function BalanceButton() {
  const { toast } = useToast()
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  const { isLoggedIn, userInfo } = useContext(magicContext);

  useEffect(() => {
    if (isLoggedIn && userInfo) {
      const interval = setInterval(() => {
        // console.log('Checking for updates')
        getUser(userInfo.address).then((user) => {
          if (user) {
            getBalance(user.address, '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::z_apt::ZAPT').then((balance) => {
              setBalance(balance);
            });
          }
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  });

  const onWithdraw = async () => {

    if (!isLoggedIn || !userInfo) return;

    const tx = await transferCoin(userInfo.private_key, parseFloat(transferAmount), recipientAddress, '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::z_apt::ZAPT');

    if (!tx) {
      toast({
        title: "Failed to withdraw funds",
      });
      return;
    }

    withdraw funds
    toast({
      title: "Funds withdrawn",
      description: <Link href={`https://explorer.aptoslabs.com/txn/${tx.version}/?network=randomnet`} target="_blank" className="underline">View transaction</Link>
    })
  }
  
  if (isLoggedIn && userInfo) {
    return (
      <Dialog>
      <DialogTrigger asChild>
        <button className="bg-neutral-800 hover:bg-neutral-700 px-2 py-1 text-xs text-white font-semibold">
          {balance?.toFixed(2) || parseInt('0').toFixed(2)} zAPT
        </button>
      </DialogTrigger>
      <DialogContent className="bg-neutral-950">
        <input type="text" autoFocus className="hidden" />
        <DialogTitle>Your balance: <span className="font-normal">{balance?.toFixed(2) || parseInt('0').toFixed(2)} zAPT</span></DialogTitle>
        <DialogTitle>Deposit Funds</DialogTitle>
        <DialogDescription>
          Send APT to the public address below to deposit funds into your account.
        </DialogDescription>
        <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
          <label
            htmlFor="public_address"
            className="text-left "
          >
            Public address
          </label>
          <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
            <input
              id="public_address"
              disabled
              value={userInfo.address}
              className="bg-transparent border-none outline-none text-right text-ellipsis cursor-not-allowed"
            />
            <Clipboard className="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100" onClick={() => {
              // copy public address to clipboard
              navigator.clipboard.writeText(userInfo.address);
              toast({
                title: "Address copied to clipboard",
              });
            }} />
          </span>
        </div>
        <DialogTitle>Withdraw Funds</DialogTitle>
        <DialogDescription>
          Withdraw APT from your account to the address specified below.
        </DialogDescription>
        <div className="flex flex-col w-full items-end w-full gap-2">
          <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2 w-full">
            <label
              htmlFor="public_address"
              className="text-left "
            >
              Amount
            </label>
            <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
              <input
                id="public_address"
                placeholder={`${balance?.toFixed(2) || parseInt('0').toFixed(2)}`}
                value={parseFloat(transferAmount) > 0 ? transferAmount : ''}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="bg-transparent border-none outline-none text-right text-ellipsis"
              />
              <span>APT</span>
            </span>
          </div>
          <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2 w-full">
            <label
              htmlFor="public_address"
              className="text-left "
            >
              Recipient address
            </label>
            <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
              <input
                id="public_address"
                placeholder={userInfo.address}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="bg-transparent border-none outline-none text-right text-ellipsis"
              />
            </span>
          </div>
          <button onClick={onWithdraw} className={cn(
            "border border-yellow-700 px-6 py-1 text-yellow-500 bg-neutral-950",
            parseFloat(transferAmount) > 0 && balance && parseFloat(transferAmount) <= balance && recipientAddress != '' && 'bg-[#404226]/40'
          )}>
            Withdraw
          </button>
        </div>
        {/* <DialogTitle>Running low on funds?</DialogTitle>
        <DialogDescription>
          Refer friends to Zion.bet to earn more 500 more zAPT. 
        </DialogDescription>
        <div>
          <Link href="https://twitter.com/intent/tweet?text=Check out https://zion.bet/crash to earn big!">Refer</Link>
        </div> */}
        <DialogTitle>Aptos on-ramp (COMING SOON)</DialogTitle>
        <DialogDescription>
          Purchase APT with your credit card and deposit it into your account.
        </DialogDescription>
      </DialogContent>
    </Dialog>
    )
  } else {
    return null;
  }
}
