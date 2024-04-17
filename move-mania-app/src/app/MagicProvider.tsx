'use client';

import { setUpAndGetUser, updateUser } from "@/lib/api";
import { magic } from "@/lib/magic";
import { User, UserV2 } from "@/lib/schema";
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
import { MagicAptosWallet } from "@magic-ext/aptos";

interface MagicProviderProps {
  isLoggedIn: boolean | null;
  userInfo: UserV2 | null;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  publicAddress: string | null,
  aptosWallet: MagicAptosWallet | null
}

export const magicContext = createContext<MagicProviderProps>({
  isLoggedIn: null,
  userInfo: null,
  setIsLoggedIn: () => {},
  publicAddress: null,
  aptosWallet: null
}); 


export default function MagicProvider({ children }: { children: React.ReactNode }) {

  const [ isLoggedIn, setIsLoggedIn ] = useState<boolean | null>(null);
  const [ userInfo, setUserInfo ] = useState<UserV2 | null>(null);
  const [ publicAddress, setPublicAddress ] = useState<string | null>(null);
  const [ aptosWallet, setAptosWallet ] = useState<MagicAptosWallet | null>(null);

  // useEffect(() => {
  //   if (!magic) {
  //     console.error('Magic not yet initialized');
  //     return;
  //   }
  //   console.log('magic', magic)
  //   magic.user.isLoggedIn().then((isLoggedIn) => {
  //     console.log('isLoggedIn', isLoggedIn)
  //     setIsLoggedIn(isLoggedIn);
  //   //   if (isLoggedIn) {
  //   //     if (!magic) {
  //   //       console.error('Magic not yet initialized');
  //   //       return;
  //   //     }
  //   //     magic.aptos.getAccountInfo().then((userInfo) => {
  //   //       console.log('userInfo', userInfo)
  //   //       setPublicAddress(userInfo.address);
          
  //   //       setUpAndGetUser({
  //   //         address: userInfo.address,
  //   //       }).then((user) => {
  //   //         if (user) {
  //   //           setUserInfo(user);
  //   //         }
  //   //       });
  //   //     });
  //   //   }
  //   });
  // }, [])

  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn: boolean) => {
      console.log('magicIsLoggedIn', magicIsLoggedIn)
      setIsLoggedIn(magicIsLoggedIn);

      if (magicIsLoggedIn) {
        const magicAptosWallet = new MagicAptosWallet(magic, {
          connect: async () => {
            return await magic.aptos.getAccountInfo();
          },
        });
        setAptosWallet(magicAptosWallet);
        console.log('magicAptosWallet', magicAptosWallet)

        const accountInfo = await magicAptosWallet.account();
        setPublicAddress(accountInfo.address);
        console.log('accountInfo', accountInfo)
        setUpAndGetUser({
          address: accountInfo.address,
        }).then((user) => {
          if (user) {
            setUserInfo(user);
          }
        });
      }
    });
  }, []);

  return (
    <magicContext.Provider value={{
      isLoggedIn,
      userInfo,
      setIsLoggedIn,
      publicAddress,
      aptosWallet
    }}>
      {children}
    </magicContext.Provider>
  )
}