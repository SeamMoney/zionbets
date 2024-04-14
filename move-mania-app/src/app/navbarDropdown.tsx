'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User } from "@/lib/schema";
import { Ellipsis, Mail, Phone } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { magicLoginEmail, magicLoginPhone } from "@/lib/magic";
import { magicContext } from "./MagicProvider";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


export default function NavbarDropdown() {

  const searchParams = useSearchParams();
  const referredBy = searchParams.get("ref");

  const { isLoggedIn, setIsLoggedIn } = useContext(magicContext);

  const [ emailPhoneToggle, setEmailPhoneToggle ] = useState<boolean>(false);
  const [ phoneInput, setPhoneInput ] = useState<string>("");
  const [ emailInput, setEmailInput ] = useState<string>("");

  const countryCodeRef = useRef<HTMLSelectElement>(null);

  return (
    <div className="flex flex-row items-center gap-2">
      {
        !isLoggedIn && 
        <Dialog>
        <DialogTrigger asChild>
          <button
            className="bg-white px-6 py-1 text-neutral-950 active:scale-95 active:opacity-50 transition-transform"
          >
            Sign in
          </button>
        </DialogTrigger>
        <DialogContent className="bg-neutral-950">
          <input type="text" autoFocus className="hidden" />
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Enter your phone number or email to sign in.
          </DialogDescription>
          <div className="flex flex-col gap-2">
            {
              emailPhoneToggle ?
              <button
                className="bg-white h-10 text-neutral-950 active:scale-95 active:opacity-50 transition-transform"
                // onClick={async () => {
                //   await magicLoginPhone('+447741234567')
                //   setIsLoggedIn(true);
                // }}
                onClick={() => setEmailPhoneToggle(false)}
              >
                Continue with Phone
              </button>
              :
              <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row items-center justify-between px-4 h-10 w-full">
                <label
                  htmlFor="public_address"
                  className="text-left "
                >
                  <Phone />
                </label>
                <select className="bg-transparent " ref={countryCodeRef} defaultValue='+1'>
                  <option value="+1">US +1</option>
                  <option value="+44">UK +44</option>
                </select>
                <span className="flex flex-row justify-center items-center gap-1">
                  <input
                    id="public_address"
                    placeholder={'201 555 0123'}
                    value={phoneInput}
                    onChange={(e) => {setPhoneInput(e.target.value)}}
                    className="bg-transparent border-none outline-none text-ellipsis"
                  />
                </span>
                <button
                  onClick={async () => {
                    const countryCode = countryCodeRef.current?.value;
                    await magicLoginPhone(countryCode + phoneInput)
                    setIsLoggedIn(true);
                  }}
                >
                  Submit
                </button>
              </div>
            }
            {
              !emailPhoneToggle ?
              <button
                className="bg-white h-10 text-neutral-950 active:opacity-50 transition-transform"
                // onClick={async () => {
                //   await magicLoginPhone('+447741234567')
                //   setIsLoggedIn(true);
                // }}
                onClick={() => {setEmailPhoneToggle(true)}}
              >
                Continue with Email
              </button>
              :
              <div className="border border-neutral-700 bg-neutral-800/20 bg-noise items-center flex flex-row justify-between px-4 h-10 w-full">
                <label
                  htmlFor="public_address"
                  className="text-left "
                >
                  <Mail />
                </label>
                <span className=" flex flex-row justify-center items-center gap-1">
                  <input
                    id="public_address"
                    placeholder={'your@email.com'}
                    value={emailInput}
                    onChange={(e) => {setEmailInput(e.target.value)}}
                    className="bg-transparent border-none outline-none text-ellipsis"
                  />
                </span>
                <button
                  onClick={async () => {
                    await magicLoginEmail(emailInput)
                    setIsLoggedIn(true);
                  }}
                >
                  Submit
                </button>
              </div>
            }
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