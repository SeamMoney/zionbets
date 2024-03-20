'use client';

import { magic } from "@/lib/magic";
import { createContext, useEffect, useState } from "react";

interface MagicProviderProps {
  isLoggedIn: boolean;
  userInfo: any;
}

export const magicContext = createContext<MagicProviderProps>({
  isLoggedIn: false,
  userInfo: null,
}); 


export default function MagicProvider({ children }: { children: React.ReactNode }) {

  const [ isLoggedIn, setIsLoggedIn ] = useState(false);
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
      userInfo
    }}>
      {children}
    </magicContext.Provider>
  )
}