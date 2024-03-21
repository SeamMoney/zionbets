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
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";


export default function NavbarDropdown() {

  const { isLoggedIn, setIsLoggedIn, setUserInfo } = useContext(magicContext);

  const [ phone, setPhone ] = useState<string>('');
  const [ countryCode, setCountryCode ] = useState<string>('1');

  const handleLogin = async () => {
    console.log('logging in')

    const deformatedPhone = phone.replace(/[^0-9]/g, '');
    if (deformatedPhone.length < 10) {
      console.error('Invalid phone number');
      return;
    }

    console.log('deformatedPhone', deformatedPhone)

    const res = await magicLogin(`+${countryCode}${deformatedPhone}`);
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
  }

  /**
   *
   * @param phone the phone number to format
   * 
   * @returns the formatted phone number in the format (210)555-0123. If the phone number is less 
   * than 10 digits, it will return the phone number as formatted as possible. Such as (210)5 or
   * (210)555-012 or (21
   */
  const formatPhoneNumberInput = (phone: string) => {
    const formatted = phone.replace(/[^0-9]/g, '');
    if (formatted.length < 4) {
      return `(${formatted}`;
    } else if (formatted.length < 7) {
      return `(${formatted.slice(0, 3)})${formatted.slice(3)}`;
    } else {
      return `(${formatted.slice(0, 3)})${formatted.slice(3, 6)}-${formatted.slice(6, 10)}`;
    }
  }


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
        
        <Dialog>
        <DialogTrigger asChild>
          <button
            className="bg-white px-6 py-1 text-neutral-950"
          >
            {
              isLoggedIn === null ? 'Loading...' : 'Sign in'
            }
          </button>
        </DialogTrigger>
        <DialogContent className="bg-neutral-950">
          <input type="text" autoFocus className="hidden" />
          <DialogTitle>Get access to your Zion Bets account</DialogTitle>
          <DialogDescription>
            Enter your phone number to receive your one-time sign in code.
          </DialogDescription>
          <div className="flex flex-col items-end w-full w-full gap-2">
            <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2 w-full">
              <label
                htmlFor="public_address"
                className="text-left "
              >
                Phone
              </label>
              <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
                <span>APT</span>  
                <input
                  id="public_address"
                  placeholder="(210)555-0123"
                  value={formatPhoneNumberInput(phone)}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-transparent border-none outline-none text-left text-ellipsis"
                />
              </span>
            </div>
            <button 
              className={cn(
                "border border-yellow-700 px-6 py-1 text-yellow-500 bg-neutral-950",
                // parseFloat(transferAmount) > 0 && balance && parseFloat(transferAmount) <= balance && recipientAddress != '' && 'bg-[#404226]/40'
              )}
              onClick={handleLogin}
            >
              Submit
            </button>
          </div>
        </DialogContent>
      </Dialog>
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