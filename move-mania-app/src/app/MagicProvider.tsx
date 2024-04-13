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

  return (
    <magicContext.Provider value={{
      isLoggedIn,
      userInfo,
      setIsLoggedIn,
    }}>
      {children}
    </magicContext.Provider>
  )
}