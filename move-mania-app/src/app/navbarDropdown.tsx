'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUser, setUpAndGetUser } from "@/lib/api";
import { User } from "@/lib/schema";
import { Ellipsis } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { gameStatusContext } from "./CrashProvider";
import { magicLoginEmail, magicLoginPhone } from "@/lib/magic";
import { magicContext } from "./MagicProvider";


export default function NavbarDropdown() {

  const searchParams = useSearchParams();
  const referredBy = searchParams.get("ref");

  const { account } = useContext(gameStatusContext);
  const { isLoggedIn, setIsLoggedIn } = useContext(magicContext);

  // const [account, setAccount] = useState<User | null>(null);

  // useEffect(() => {
  //   getSession().then((session) => {
  //     if (session) {
  //       if (!session.user || !session.user.email) return;

  //       getUser(
  //         session.user.email
  //       ).then((user) => {
  //         if (user) {
  //           setAccount(user);
  //         }
  //       });
  //     }
  //   });
  // }, []);

  return (
    <div className="flex flex-row items-center gap-2">
      {
        !isLoggedIn && 
        <button
          className="bg-white px-6 py-1 text-neutral-950 active:scale-95 active:opacity-50 transition-transform"
          onClick={async () => {
            // signIn("google", {callbackUrl: `/${referredBy ? `?ref=${referredBy}` : ''}`});
            // console.log('sign in')
            // await magicLoginPhone('+12062299029')
            await magicLoginEmail('daniel.7039@hotmail.com')
            setIsLoggedIn(true);
          }}
        >
          Sign in
        </button>
      }
      <DropdownMenu>
        <DropdownMenuTrigger><Ellipsis /></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Navigation</DropdownMenuLabel>
          <Link href='/'><DropdownMenuItem>Crash</DropdownMenuItem></Link>
          <Link href='/pool'><DropdownMenuItem>Pool</DropdownMenuItem></Link>
          <Link href='/account'><DropdownMenuItem>My account</DropdownMenuItem></Link>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Socials</DropdownMenuLabel>
          <Link href="https://twitter.com/zionbets" target="_blank"><DropdownMenuItem>Twitter</DropdownMenuItem></Link>
          <Link href="https://t.me/zion_bets" target="_blank"><DropdownMenuItem>Telegram</DropdownMenuItem></Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}