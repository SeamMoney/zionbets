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
  AptosClient,
  BCS,
  CoinClient,
  FaucetClient,
  TxnBuilderTypes,
} from "aptos";

import { User } from "@/lib/schema";
import { Clipboard, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { getSession, signIn, signOut } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link";
import { RPC_URL, getBalance, transferApt } from "@/lib/aptos";
import { cn } from "@/lib/utils";
import { keylessContext } from "./KeylessProvider";

const MAGIC_WALLET_ADDRESS =
  "0xa8256b208efd4be625e0de7d473d89bc5b8e09ef578c84642b09f89492e96054";
const SAMPLE_RAW_TRANSACTION = {
  type: "entry_function_payload",
  function: "0x1::coin::transfer",
  type_arguments: ["0x1::aptos_coin::AptosCoin"],
  arguments: [MAGIC_WALLET_ADDRESS, 1000],
};


export default function BalanceButton() {
  const { toast } = useToast()
  const { isLoggedIn, userInfo, keylessAccount } = useContext(keylessContext);
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // getSession().then((session) => {
    //   if (session) {
    //     if (!session.user) return;

    //     if (!session.user || !session.user.email) return;

    //     getUser(
    //       session.user.email
    //     ).then((user) => {
          if (isLoggedIn && userInfo) {
            // setAccount(user);
            getBalance(userInfo.address, `${process.env.MODULE_ADDRESS}::z_apt::ZAPT`).then((balance) => {
              setBalance(balance);
            });
          }
    //     });
    //   }
    // });
  }, [isLoggedIn, userInfo]);

  useEffect(() => {
      const interval = setInterval(() => {
        // console.log('Checking for updates')
        // getUser(account.email).then((user) => {
          if (isLoggedIn && userInfo) {
            // console.log('balance: ', user.balance)
            // setAccount(user);
            getBalance(userInfo.address, `${process.env.MODULE_ADDRESS}::z_apt::ZAPT`).then((balance) => {
              setBalance(balance);
            });
          }
        // });
      }, 1000);
      return () => clearInterval(interval);
  });

  const onWithdraw = async () => {

    // setResultB(null);

    if (!userInfo || !keylessAccount) {
      console.warn("No account");
      return;
    }

    // const token = new TxnBuilderTypes.TypeTagStruct(
    //   TxnBuilderTypes.StructTag.fromString("0x1::aptos_coin::AptosCoin")
    // );

    // const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    //   TxnBuilderTypes.EntryFunction.natural(
    //     "0x1::coin",
    //     "transfer",
    //     [token],
    //     [
    //       BCS.bcsToBytes(
    //         TxnBuilderTypes.AccountAddress.fromHex(MAGIC_WALLET_ADDRESS)
    //       ),
    //       BCS.bcsSerializeUint64(1000),
    //     ]
    //   )
    // );

    // const { hash } = await keylessAccount.signAndSubmitBCSTransaction(payload);

    // const client = new AptosClient(RPC_URL);
    // await client.waitForTransaction(hash, {
    //   checkSuccess: true,
    // });
    // console.log("Transaction succeeded with hash: ", hash);
    // setResultB(hash);

    if (!isLoggedIn || !userInfo || !balance || transferAmount == '') return;
    if (parseFloat(transferAmount) <= 0) {
      toast({
        title: "Please enter a valid amount",
      });
      return;
    }
    if (parseFloat(transferAmount) > balance) {
      toast({
        title: "Insufficient funds",
      });
      return;
    }
    if (recipientAddress == '') {
      toast({
        title: "Please enter a recipient address",
      });
      return;
    }

    setLoading(true);

    const tx = await transferApt(keylessAccount, parseFloat(transferAmount), recipientAddress,  `${process.env.MODULE_ADDRESS}::z_apt::ZAPT`);

    if (!tx) {
      toast({
        title: "Failed to withdraw funds",
      });
      setLoading(false);
      return;
    }

    // withdraw funds
    toast({
      title: "Funds withdrawn",
      description: <Link href={`https://explorer.aptoslabs.com/txn/${tx.version}/?network=devnet`} target="_blank" className="underline">View transaction</Link>
    })
    setLoading(false);

    // clear input fields
    setRecipientAddress('');
    setTransferAmount('');


  }

  if ((isLoggedIn && !userInfo)) {
    return (
      <button className="bg-neutral-800 hover:bg-neutral-700 px-2 py-1 text-xs text-white font-semibold">
        <Loader2Icon className="animate-spin" />
      </button>
    )
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
                value={transferAmount}
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
            parseFloat(transferAmount) > 0 && balance && parseFloat(transferAmount) <= balance && recipientAddress != '' && 'bg-[#404226]/40  active:scale-95 active:opacity-80 transition-transform',
            loading && 'scale-95 opacity-80 cursor-not-allowed'
          )}>
            {
              loading ? <Loader2Icon className="animate-spin" /> : 'Withdraw'
            }
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
