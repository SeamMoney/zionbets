'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getBalance, getLPCoinSupply, simulateDeposit, simulateWithdraw, supplyPool, withdrawPool } from "@/lib/aptos";
import { User } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { get } from "http";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { gameStatusContext } from "../CrashProvider";
import { magicContext } from "../MagicProvider";


export default function PoolModal() {

  const { isLoggedIn, userInfo } = useContext(magicContext);
  const [balance, setBalance] = useState<number>(0)
  const [lpCoinSupply, setLpCoinSupply] = useState<number>(0)
  const [aptBalance, setAptBalance] = useState<number>(0)

  const [depositAmount, setDepositAmount] = useState<string>('')
  const [expectedReturnFromDeposit, setExpectedReturnFromDeposit] = useState<number>(0)
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')
  const [expectedReturnFromWithdraw, setExpectedReturnFromWithdraw] = useState<number>(0)

  const { toast } = useToast()
  
  useEffect(() => {
    if (isLoggedIn && userInfo) {
      try {
        getBalance(userInfo.address, `${process.env.MODULE_ADDRESS}::liquidity_pool::LPCoin`).then((balance) => {
          setBalance(balance);
          // simulateWithdraw(userInfo, balance).then((txn) => {
          //   if (txn) {
          //     setExpectedReturnFromWithdraw(txn);
          //   }
          // });
        });
      } catch (e) {
        console.log(e)
      }
      try {
        getBalance(userInfo.address, `${process.env.MODULE_ADDRESS}::z_apt::ZAPT`).then((balance) => {
          setAptBalance(balance);
          // simulateDeposit(userInfo, balance).then((txn) => {
          //   if (txn) {
          //     setExpectedReturnFromDeposit(txn);
          //   }
          // });
        });
      } catch (e) {
        console.log(e)
      }
    }

    getLPCoinSupply().then((supply) => {
      setLpCoinSupply(supply)
    });
  }, [isLoggedIn, userInfo]);


  useEffect(() => {
    if (isLoggedIn && userInfo) {
      const interval = setInterval(() => {
        // console.log('Checking for updates')
        try {
          getBalance(userInfo.address, `${process.env.MODULE_ADDRESS}::liquidity_pool::LPCoin`).then((balance) => {
            setBalance(balance);
            // simulateWithdraw(userInfo, balance).then((txn) => {
            //   if (txn) {
            //     setExpectedReturnFromWithdraw(txn);
            //   }
            // });
          });
        } catch (e) {
          console.log(e)
        }
        try {
          getBalance(userInfo.address, `${process.env.MODULE_ADDRESS}::z_apt::ZAPT`).then((balance) => {
            setAptBalance(balance);
            // simulateDeposit(userInfo, balance).then((txn) => {
            //   if (txn) {
            //     setExpectedReturnFromDeposit(txn);
            //   }
            // });
          });
        } catch (e) {
          console.log(e)
        }
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
                  onChange={async (e) => {
                    // setDepositAmount(e.target.value)

                    // if (!isLoggedIn || !userInfo) return;

                    // if (e.target.value === '') {
                    //   await simulateDeposit(userInfo, aptBalance).then((txn) => {
                    //     if (txn) {
                    //       setExpectedReturnFromDeposit(txn);
                    //     }
                    //   });
                    //   return;
                    // }


                    // await simulateDeposit(userInfo, parseFloat(e.target.value)).then((txn) => {
                    //   if (txn) {
                    //     setExpectedReturnFromDeposit(txn);
                    //   }
                    // });
                  }}
                  className="bg-transparent border-none outline-none text-right text-ellipsis"
                />
                <span>zAPT</span>
              </span>
            </div>
            <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2 w-full">
              <label
                htmlFor="public_address"
                className="text-left "
              >
                Expected Return
              </label>
              <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
                <input
                  id="public_address"
                  placeholder={expectedReturnFromDeposit >= 0 ? expectedReturnFromDeposit.toFixed(2) : 'Invalid'}
                  disabled
                  className="bg-transparent border-none outline-none text-right text-ellipsis"
                />
                <span>shares</span>
              </span>
            </div>
            <button  
              className={cn(
                "border border-yellow-700 px-6 py-1 text-yellow-500 bg-neutral-950",
                parseFloat(depositAmount) > 0 && aptBalance && parseFloat(depositAmount) <= aptBalance && 'bg-[#404226]/40 active:scale-95 active:opacity-50 transition-transform'
              )}
              onClick={async () => {
                // if (!isLoggedIn || !userInfo) return;

                // if (depositAmount === '') {
                //   toast({
                //     title: "Please enter a valid amount to deposit",
                //   });
                //   return;
                // }

                // const tx = await supplyPool(userInfo, parseFloat(depositAmount));
                // if (!tx) {
                //   toast({
                //     title: "Failed to deposit funds",
                //   });
                //   return;
                // }
                // toast({
                //   title: "Funds deposited",
                //   description: <Link href={`https://explorer.aptoslabs.com/txn/${tx.version}/?network=devnet`} target="_blank" className="underline">View transaction</Link>
                // })
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
                className="text-left"
              >
                Withdraw Amount
              </label>
              <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
                <input
                  id="public_address"
                  placeholder={`${balance?.toFixed(2) || parseInt('0').toFixed(2)}`}
                  value={withdrawAmount}
                  onChange={async (e) => {
                    // setWithdrawAmount(e.target.value)

                    // if (!userInfo || !isLoggedIn) return;

                    // if (e.target.value === '') {
                    //   await simulateWithdraw(userInfo, balance).then((txn) => {
                    //     if (txn) {
                    //       setExpectedReturnFromWithdraw(txn);
                    //     }
                    //   });
                    //   return;
                    // }

                    // simulateWithdraw(userInfo, parseFloat(e.target.value)).then((txn) => {
                    //   if (txn) {
                    //     setExpectedReturnFromWithdraw(txn);
                    //   }
                    // });
                  }}
                  className="bg-transparent border-none outline-none text-right text-ellipsis"
                />
                <span>shares</span>
              </span>
            </div>
            <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2 w-full">
              <label
                htmlFor="public_address"
                className="text-left "
              >
                Expected Return
              </label>
              <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
                <input
                  id="public_address"
                  placeholder={expectedReturnFromWithdraw >= 0 ? expectedReturnFromWithdraw.toFixed(2) : 'Invalid'}
                  disabled
                  className="bg-transparent border-none outline-none text-right text-ellipsis"
                />
                <span>zAPT</span>
              </span>
            </div>
            <button 
              className={cn(
                "border border-yellow-700 px-6 py-1 text-yellow-500 bg-neutral-950",
                parseFloat(withdrawAmount) > 0 && balance && parseFloat(withdrawAmount) <= balance && 'bg-[#404226]/40 active:scale-95 active:opacity-50 transition-transform'
              )}
              onClick={async () => {
                // if (!userInfo || !isLoggedIn) return;

                // if (withdrawAmount === '') {
                //   toast({
                //     title: "Please enter a valid amount to withdraw",
                //   });
                //   return;
                // }

                // const tx = await withdrawPool(userInfo, parseFloat(withdrawAmount));
                // if (!tx) {
                //   toast({
                //     title: "Failed to withdraw funds",
                //   });
                //   return;
                // }
                // toast({
                //   title: "Funds withdrawn",
                //   description: <Link href={`https://explorer.aptoslabs.com/txn/${tx.version}/?network=devnet`} target="_blank" className="underline">View transaction</Link>
                // })
              }}
            >
              Withdraw
            </button>
          </div>
      </DialogContent>
    </Dialog>
  )
}