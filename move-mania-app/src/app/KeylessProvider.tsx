'use client';

import { createContext, useEffect } from "react";

interface KeylessProviderProps {
  logIn: () => Promise<void>;
}

export const keylessContext = createContext<KeylessProviderProps>({
  logIn: async () => {}
});

export default function KeylessProvider({ children }: { children: React.ReactNode }) {


  useEffect(() => {
    console.log("KeylessProvider mounted");
    finishKeylessAuth();
  }, [])

  const beginKeylessAuth = async () => {
    console.log("beginKeylessAuth");
  }

  const finishKeylessAuth = async () => {
    console.log("finishKeylessAuth");
  }

  return (
    <keylessContext.Provider value={{
      logIn: beginKeylessAuth
    }}>
      {children}
    </keylessContext.Provider>
  )
}