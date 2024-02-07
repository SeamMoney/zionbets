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
import { getSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AccountButton() {

  const [account, setAccount] = useState<User | null>(null)

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
        <SheetContent>
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
              </>
            )
          }
        </SheetContent>
      </Sheet>
    </div>
  )
}