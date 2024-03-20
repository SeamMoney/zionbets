'use client';

import { RPC_URL } from "@/lib/aptos";
import { AptosExtension } from "@magic-ext/aptos";
import { Magic } from "magic-sdk";
import { createContext, useEffect, useState } from "react";

interface MagicProviderProps {
    // login: (phoneNumber: string) => Promise<void>;
}

export const magicContext = createContext<MagicProviderProps>({
    // login: async () => {},
}); 


export default function MagicProvider({ children }: { children: React.ReactNode }) {

  return (
    <magicContext.Provider value={{
      // login,
    }}>
      {children}
    </magicContext.Provider>
  )
}