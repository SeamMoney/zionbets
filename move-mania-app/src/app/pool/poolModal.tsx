'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getUser, setUpAndGetUser } from "@/lib/api";
import { getBalance, getLPCoinSupply, supplyPool } from "@/lib/aptos";
import { User } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { get } from "http";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";


export default function PoolModal() {

  const [account, setAccount] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0)
  const [lpCoinSupply, setLpCoinSupply] = useState<number>(0)
  const [aptBalance, setAptBalance] = useState<number>(0)

  const [depositAmount, setDepositAmount] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')

  const { toast } = useToast()
  
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
            getBalance(user.private_key, '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::liquidity_pool::LPCoin').then((balance) => {
              setBalance(balance);
            });
            getBalance(user.private_key, '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::z_apt::ZAPT').then((balance) => {
              setAptBalance(balance);
            });
          }
        });
      }
    });

    getLPCoinSupply().then((supply) => {
      setLpCoinSupply(supply)
    });
  }, []);

  useEffect(() => {
    if (account) {
      const interval = setInterval(() => {
        // console.log('Checking for updates')
        getUser(account.email).then((user) => {
          if (user) {
            // console.log('balance: ', user.balance)
            setAccount(user);
            getBalance(user.private_key, '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::liquidity_pool::LPCoin').then((balance) => {
              setBalance(balance);
            });
            getBalance(user.private_key, '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::z_apt::ZAPT').then((balance) => {
              setAptBalance(balance);
            });
          }
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="border border-green-700 px-6 py-1 border-yellow-700 text-yellow-500 w-full bg-[#404226]/40">
          Manage shares
        </button>
      </DialogTrigger>
      <DialogContent className="bg-neutral-950">
          <DialogTitle>Your shares: {balance.toFixed(2)} ({`${(balance / lpCoinSupply * 100).toFixed(2)}`}% of pool)</DialogTitle>
          <DialogTitle>Supply Pool</DialogTitle>
          <DialogDescription>
            Deposit zAPT into the pool to earn a share of the pool&apos;s profits.
          </DialogDescription>
          <div className="flex flex-col w-full items-end w-full gap-2">
            <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2 w-full">
              <label
                htmlFor="public_address"
                className="text-left "
              >
                Deposit Amount
              </label>
              <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
                <input
                  id="public_address"
                  placeholder={`${aptBalance?.toFixed(2) || parseInt('0').toFixed(2)}`}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-transparent border-none outline-none text-right text-ellipsis"
                />
                <span>zAPT</span>
              </span>
            </div>
            <button  
              className={cn(
                "border border-yellow-700 px-6 py-1 text-yellow-500 bg-neutral-950",
                parseFloat(depositAmount) > 0 && aptBalance && parseFloat(depositAmount) <= aptBalance && 'bg-[#404226]/40'
              )}
              onClick={async () => {
                if (!account) return;
                const tx = await supplyPool(account, parseFloat(depositAmount));
                if (!tx) {
                  toast({
                    title: "Failed to deposit funds",
                  });
                  return;
                }
                toast({
                  title: "Funds deposited",
                  description: <Link href={`https://explorer.aptoslabs.com/txn/${tx.version}/?network=randomnet`} target="_blank" className="underline">View transaction</Link>
                })
              }}  
            >
              Deposit
            </button>
          </div>
          <DialogTitle>Redeem Shares</DialogTitle>
          <DialogDescription>
            Redeem your shares for your share of the pool&apos;s zAPT.
          </DialogDescription>
          <div className="flex flex-col w-full items-end w-full gap-2">
            <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2 w-full">
              <label
                htmlFor="public_address"
                className="text-left "
              >
                Withdraw Amount
              </label>
              <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
                <input
                  id="public_address"
                  placeholder={`${balance?.toFixed(2) || parseInt('0').toFixed(2)}`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="bg-transparent border-none outline-none text-right text-ellipsis"
                />
                <span>shares</span>
              </span>
            </div>
            <button 
              className={cn(
                "border border-yellow-700 px-6 py-1 text-yellow-500 bg-neutral-950",
                parseFloat(withdrawAmount) > 0 && balance && parseFloat(withdrawAmount) <= balance && 'bg-[#404226]/40'
              )}
              onClick={async () => {
                if (!account) return;
                const tx = await supplyPool(account, parseFloat(withdrawAmount));
                if (!tx) {
                  toast({
                    title: "Failed to withdraw funds",
                  });
                  return;
                }
                toast({
                  title: "Funds withdrawn",
                  description: <Link href={`https://explorer.aptoslabs.com/txn/${tx.version}/?network=randomnet`} target="_blank" className="underline">View transaction</Link>
                })
              }}
            >
              Withdraw
            </button>
          </div>
      </DialogContent>
    </Dialog>
  )
}