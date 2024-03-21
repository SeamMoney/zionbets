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
import { magic, magicLogin, magicLogout } from "@/lib/magic";


export default function NavbarDropdown() {

  const { isLoggedIn, setIsLoggedIn, setUserInfo } = useContext(magicContext);

  return (
    <div className="flex flex-row items-center gap-2">
      {
        isLoggedIn && 
        <button
          className="bg-white px-6 py-1 text-neutral-950"
          onClick={async () => {
            await magicLogout()
          }}
        >
          Sign out
        </button>
      }
      {
        !isLoggedIn && 
        <button
          className="bg-white px-6 py-1 text-neutral-950"
          onClick={async () => {
            console.log('logging in')
            const res = await magicLogin('+12062299029')
            console.log('res', res)

            if (!magic) {
              console.error('Magic not yet initialized');
              return;
            }
            console.log('magic', magic)
            magic.user.isLoggedIn().then((isLoggedIn) => {
              console.log('isLoggedIn', isLoggedIn)
              setIsLoggedIn(isLoggedIn);
        
              if (!magic) {
                console.error('Magic not yet initialized');
                return;
              }
        
              if (isLoggedIn) {
                magic.user.getMetadata().then((metadata) => {
                  console.log('metadata', metadata)
                  setUserInfo(metadata);
                })
              }
            });
          }}
        >
          {
            isLoggedIn === null ? 'Loading...' : 'Sign in'
          }
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