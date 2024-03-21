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
import { ChevronDown, Ellipsis } from "lucide-react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { magicContext } from "./MagicProvider";
import { magic, magicLogin, magicLogout } from "@/lib/magic";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { COUNTRY_CODES } from "@/lib/utils";



export default function NavbarDropdown() {

  const { isLoggedIn, userInfo } = useContext(magicContext);

  return (
    <div className="flex flex-row items-center gap-2">
      {
        !isLoggedIn && isLoggedIn !== null &&
          <Link href='/account'>
            <button
              className="bg-white px-6 py-1 text-neutral-950"
            >
              Sign in
            </button>
          </Link>
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