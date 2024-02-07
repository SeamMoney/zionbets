'use client'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { doesUserExist, getUser, setUpAndGetUser, setUpUser } from "@/lib/api";
import { User } from "@/lib/schema";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { getSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AccountButton() {

  const [account, setAccount] = useState<User | null>(null)

  const [privateKeyVisible, setPrivateKeyVisible] = useState(false)

  useEffect(() => {
    getSession().then(session => {
      if (session) {
        console.log(session)
        if (!session.user) return;

        setUpAndGetUser({
          username: session.user.name || '',
          image: session.user.image || '',
          email: session.user.email || '',
        }).then(user => {
          if (user) {
            setAccount(user)
          }
        })
      }
    })
  }, [])

  const onSignIn = () => {
    signIn('google');
  }

  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <button className="bg-white px-6 py-1 font-mono text-neutral-950" >
            {account ? account.username : 'Sign in'}
          </button>
        </SheetTrigger>
        <SheetContent className="w-96">
          {
            !account ? (
              <div className="flex items-center justify-center h-32">
                <button onClick={onSignIn}>Sign in</button>
              </div>
            ) : (
              <>
                <SheetHeader>
                  <SheetTitle>Edit profile</SheetTitle>
                  <SheetDescription>
                    Make changes to your profile here. Click save when you're done.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="border border-neutral-700 flex flex-row justify-between px-4 py-2">
                    <label htmlFor="email" className="text-left font-mono">
                      Email
                    </label>
                    <span className="font-mono opacity-50 flex flex-row justify-end items-center gap-1">
                      <input id="email" placeholder={account.email} className="bg-transparent border-none outline-none text-right text-ellipsis" />
                    </span>
                  </div>
                  <div className="border border-neutral-700 flex flex-row justify-between px-4 py-2">
                    <label htmlFor="username" className="text-left font-mono">
                      Username
                    </label>
                    <span className="font-mono opacity-50 flex flex-row justify-center items-center gap-1">
                      <input id="username" placeholder={account.username} className="bg-transparent border-none outline-none text-right text-ellipsis" />
                    </span>
                  </div>
                  <div className="border border-neutral-700 flex flex-row justify-between px-4 py-2">
                    <label htmlFor="profile_pic" className="text-left font-mono">
                      Profile picture
                    </label>
                    <span className="font-mono opacity-50 flex flex-row justify-center items-center gap-1">
                      <input id="profile_pic" placeholder={account.image} className="bg-transparent border-none outline-none text-right text-ellipsis" />
                    </span>
                  </div>
                  <div className="border border-neutral-700 flex flex-row justify-between px-4 py-2">
                    <label htmlFor="public_address" className="text-left font-mono">
                      Public address
                    </label>
                    <span className="font-mono opacity-50 flex flex-row justify-center items-center gap-1">
                      <input id="public_address" disabled value={account.public_address} className="bg-transparent border-none outline-none text-right text-ellipsis" />
                    </span>
                  </div>
                  <div className="border border-neutral-700 flex flex-row justify-between px-4 py-2">
                    <label htmlFor="private_key" className="font-mono font-light w-[100px]">
                      Private key
                    </label>
                    <span className="font-mono opacity-50 flex flex-row justify-center items-center gap-1">
                      <input id="private_key" hidden={!privateKeyVisible} disabled value={account.private_key} className="bg-transparent border-none outline-none text-right text-ellipsis w-[170px]" />
                      {
                        !privateKeyVisible ? (
                          <EyeIcon className="cursor-pointer" onClick={() => setPrivateKeyVisible(true)} />
                        ) : (
                          <EyeOffIcon className="cursor-pointer" onClick={() => setPrivateKeyVisible(false)} />
                        )
                      }
                    </span>
                  </div>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <button type="submit" className="border border-green-500 px-6 py-1 text-green-500">Save changes</button>
                  </SheetClose>
                </SheetFooter>
              </>
            )
          }
        </SheetContent>
      </Sheet>
    </div>
  )
}