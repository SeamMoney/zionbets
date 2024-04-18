'use client';

import { setUpAndGetUser, updateUser } from "@/lib/api";
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
import { AptosExtension, MagicAptosWallet } from "@magic-ext/aptos";
import { Magic } from "magic-sdk";
import { RPC_URL } from "@/lib/aptos";

const createMagic = () => {
  return typeof window !== "undefined" && new Magic(
    'pk_live_A097CA542D008F6E', 
    {
      extensions: [
        new AptosExtension({
          nodeUrl: RPC_URL
        }),
      ],
    }
  );
}
export const magic = createMagic();

interface MagicProviderProps {
  isLoggedIn: boolean | null;
  userInfo: User | null;
  logInPhone: (phone: string) => Promise<string | null>;
  logInEmail: (email: string) => Promise<string | null>;
  logOut: () => Promise<void>;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  publicAddress: string | null,
  aptosWallet: MagicAptosWallet | null;
}

export const magicContext = createContext<MagicProviderProps>({
  isLoggedIn: null,
  userInfo: null,
  setIsLoggedIn: () => {},
  publicAddress: null,
  aptosWallet: null,
  logInPhone: async () => null,
  logInEmail: async () => null,
  logOut: async () => {}
}); 


export default function MagicProvider({ children }: { children: React.ReactNode }) {

  const [ isLoggedIn, setIsLoggedIn ] = useState<boolean | null>(null);
  const [ userInfo, setUserInfo ] = useState<User | null>(null);
  const [ publicAddress, setPublicAddress ] = useState<string | null>(null);
  const [ aptosWallet, setAptosWallet ] = useState<MagicAptosWallet | null>(null);

  useEffect(() => {
    if (!magic) return 
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
        if (!magicAptosWallet) {
          return
        }
        setUpAndGetUser(
          {
            address: accountInfo.address,
          },
          magicAptosWallet
        ).then((user) => {
          if (user) {
            setUserInfo(user);
          }
        });
      }
    });
  }, []);

  const magicLoginPhone = async (phoneNumber: string) => {

    if (!magic) {
      console.error('Magic not yet initialized');
      return null;
    }
  
    // await magic.wallet.connectWithUI();
    console.log('magic', magic)
    console.log('context login')
    try {
      console.log('logging in')
      const did = await magic.auth.loginWithSMS({
        phoneNumber: phoneNumber,
      });
      console.log(`DID Token: ${did}`);

      setIsLoggedIn(true);
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
      if (!magicAptosWallet) {
        return null
      }
      setUpAndGetUser(
        {
          address: accountInfo.address,
        },
        magicAptosWallet
      ).then((user) => {
        if (user) {
          setUserInfo(user);
        }
      });
       
      return did;
    } catch(e) {
      console.log('Error logging in', e);
      return null;
    }
  }

  const magicLoginEmail = async (email: string) => {

    if (!magic) {
      console.error('Magic not yet initialized');
      return null
    }
  
    // await magic.wallet.connectWithUI();
    console.log('magic', magic)
    console.log('context login')
    try {
      console.log('logging in')
      const did = await magic.auth.loginWithEmailOTP({
        email: email
      });
      console.log(`DID Token: ${did}`);

      setIsLoggedIn(true);
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
      if (!magicAptosWallet) {
        return null
      }
      setUpAndGetUser(
        {
          address: accountInfo.address,
        },
        magicAptosWallet
      ).then((user) => {
        if (user) {
          setUserInfo(user);
        }
      });
  
      return did;
    } catch(e) {
      console.log('Error logging in', e);
      return null;
    }
  }

  const magicLogout = async () => {
    const errorMessage  = "Error creating magic instance while trying to log out"
    if (magic === false) {
      throw new Error(errorMessage)
    }
    try {
      await magic.user.logout()
      setIsLoggedIn(false)
      setUserInfo(null)
      setPublicAddress(null)
      setAptosWallet(null)
    } catch (error) {
      throw new Error(error as string)
    }
  }

  return (
    <magicContext.Provider value={{
      isLoggedIn,
      userInfo,
      setIsLoggedIn,
      publicAddress,
      aptosWallet,
      logInPhone: magicLoginPhone,
      logInEmail: magicLoginEmail,
      logOut: magicLogout
    }}>
      {children}
    </magicContext.Provider>
  )
}