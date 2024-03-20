'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setUpAndGetUser } from "@/lib/api";
import { User } from "@/lib/schema";
import { Ellipsis } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { magicContext } from "./MagicProvider";
import { magicLogin } from "@/lib/magic";


export default function NavbarDropdown() {

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

  return (
    <div className="flex flex-row items-center gap-2">
      {
        !account && 
        <button
          className="bg-white px-6 py-1 text-neutral-950"
          onClick={async () => {
            console.log('logging in')
            await magicLogin('+12062299029')
            console.log('logged in')
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