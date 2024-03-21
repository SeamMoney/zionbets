'use client';

import { magic } from "@/lib/magic";
import { createContext, useEffect, useState } from "react";

interface MagicProviderProps {
  isLoggedIn: boolean | null;
  userInfo: any;
  setUserInfo: (info: any) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
}

export const magicContext = createContext<MagicProviderProps>({
  isLoggedIn: null,
  userInfo: null,
  setUserInfo: () => {},
  setIsLoggedIn: () => {}
}); 


export default function MagicProvider({ children }: { children: React.ReactNode }) {

  const [ isLoggedIn, setIsLoggedIn ] = useState<boolean | null>(null);
  const [ userInfo, setUserInfo ] = useState<any>(null);

  useEffect(() => {
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
  })



  return (
    <magicContext.Provider value={{
      isLoggedIn,
      userInfo,
      setUserInfo,
      setIsLoggedIn
    }}>
      {children}
    </magicContext.Provider>
  )
}