'use client';

import { setUpAndGetUser, updateUser } from "@/lib/api";
import { magic } from "@/lib/magic";
import { User } from "@/lib/schema";
import { createContext, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils";

interface MagicProviderProps {
  isLoggedIn: boolean | null;
  userInfo: User | null;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

export const magicContext = createContext<MagicProviderProps>({
  isLoggedIn: null,
  userInfo: null,
  setIsLoggedIn: () => {},
}); 


export default function MagicProvider({ children }: { children: React.ReactNode }) {

  const [ isLoggedIn, setIsLoggedIn ] = useState<boolean | null>(null);
  const [ userInfo, setUserInfo ] = useState<User | null>(null);

  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    if (!magic) {
      console.error('Magic not yet initialized');
      return;
    }
    console.log('magic', magic)
    magic.user.isLoggedIn().then((isLoggedIn) => {
      console.log('isLoggedIn', isLoggedIn)
      setIsLoggedIn(isLoggedIn);
    });
  })

  useEffect(() => {
    if (isLoggedIn && magic) {
      console.log('getting metadata')
      magic.user.getInfo().then((metadata) => {
        console.log('metadata', metadata)
        console.log('setting up user')
        setUpAndGetUser({ 
          address: metadata.publicAddress!,
        }).then((user: {username:string,address:string} | null) => {
          console.log('user', user)
          if (!user) {
            console.error('Failed to set up user');
            setUserInfo(null);
            return;
          }
          setUserInfo({
            address: user.address,
            username: user.username,
            phone: metadata.phoneNumber!,
          })
        });
      });
    } else {
      console.error('User not logged in');
      setUserInfo(null);
    }
  }, [isLoggedIn])

  const onSubmit = async () => {

    if (!userInfo) {
      console.error('User not logged in');
      return;
    }

    if (username === "") {
      console.error('Username cannot be empty');
      return;
    }

    const user: User = {
      address: userInfo.address,
      username: username,
      phone: userInfo.phone,
    };

    await updateUser(userInfo.address, user);

    window.location.reload();
  };

  return (
    <magicContext.Provider value={{
      isLoggedIn,
      userInfo,
      setIsLoggedIn,
    }}>
      {children}
      <AlertDialog open={isLoggedIn == true && userInfo !== null && userInfo.username == null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Choose your username to get started</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the username you would like to use on Zion Bets. This will be the name that other users see when you play games.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col items-end w-full">
            <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2 w-full">
              <label htmlFor="username" className="text-left ">
                Username
              </label>
              <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
                <input
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                  }}
                  placeholder={'CrashMaster123'}
                  className="bg-transparent border-none outline-none text-right text-ellipsis"
                />
              </span>
            </div>
            <AlertDialogCancel>
              <button 
                className={cn(
                  "border border-yellow-700 px-6 py-1 text-yellow-500 bg-neutral-950",
                  username.length > 0 && 'bg-[#404226]/40'
                )}
                onClick={onSubmit}
              >
                Submit
              </button>
            </AlertDialogCancel>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </magicContext.Provider>
  )
}