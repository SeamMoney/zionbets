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
import { getSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export type AccountData = {
  username: string;
  email: string;
  image: string;
}

export default function AccountButton() {

  const [account, setAccount] = useState<AccountData | null>(null)

  useEffect(() => {
    getSession().then(session => {
      if (session) {
        console.log(session)
        setAccount({
          username: session.user?.name || '',
          email: session.user?.email || '',
          image: session.user?.image || '',
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>
            <button onClick={onSignIn}>sign in</button>
            <br />
            <button onClick={() => signOut()}>sign out</button>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Name
              </label>
              <input id="name" value="Pedro Duarte" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="username" className="text-right">
                Username
              </label>
              <input id="username" value="@peduarte" className="col-span-3" />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <button type="submit">Save changes</button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}