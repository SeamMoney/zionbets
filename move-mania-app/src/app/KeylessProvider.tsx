'use client';

import { Aptos, AptosConfig, Ed25519PrivateKey, EphemeralKeyPair, MultiKeyAccount,Network,KeylessAccount } from "@aptos-labs/ts-sdk";
// import dotenv from 'dotenv';
import { createContext, useEffect, useState } from "react";
import { jwtDecode } from 'jwt-decode';
import { User } from "@/lib/schema";
import { setUpAndGetUser } from "@/lib/api";
import { setLocalStorage } from "@aptos-labs/wallet-adapter-core";
import { AptosAccount,  } from "aptos";

// env
const MOVEMENT_URL = process.env.MOVEMENT_URL || "https://aptos.devnet.m1.movementlabs.xyz";

const aptos = new Aptos(new AptosConfig({fullnode:MOVEMENT_URL}));  // Only devnet supported as of now.
  /**
 * Stored ephemeral key pairs in localStorage (nonce -> ephemeralKeyPair)
 */
  export type StoredEphemeralKeyPairs = { [nonce: string]: EphemeralKeyPair };

interface KeylessProviderProps {
  keylessAccount: KeylessAccount | null | AptosAccount;
  userInfo: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  logIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const tempAccount = new AptosAccount(Uint8Array.from(Buffer.from(process.env.ADMIN_ACCOUNT_PRIVATE_KEY!)));

const tempUser: User = {
  address: new AptosAccount(Uint8Array.from(Buffer.from(process.env.ADMIN_ACCOUNT_PRIVATE_KEY!))).address().toString(),
  username: "jkjk",
  referral_code: "jkjk",
  referred_by: "jkjk"
};


export const keylessContext = createContext<KeylessProviderProps>({
  keylessAccount: null,
  userInfo: null,
  isLoggedIn: false,
  isLoading: false,
  logIn: async () => {},
  logOut: async () => {}
});





export default function KeylessProvider({ children }: { children: React.ReactNode }) {

  const [keylessAccount, setKeylessAccount] = useState<KeylessAccount | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<User | null>(tempUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  

  useEffect(() => {
    console.log("KeylessProvider mounted");
      finishKeylessAuth();
      // keylessAccount && setIsLoggedIn(true);
      // setIsLoading(false);
      // console.log(keylessAccount);
      // setIsLoggedIn(true);
    
  }, [])

  const beginKeylessAuth = async () => {
    console.log("beginKeylessAuth");

    const ephemeralKeyPair = EphemeralKeyPair.generate();
    const redirectUri = "http://localhost:3000";
    console.log("redirectUri",redirectUri);
    const clientId = process.env.GOOGLE_CLIENT_ID!
    // Get the nonce associated with ephemeralKeyPair
    const nonce = ephemeralKeyPair.nonce

    // const loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&scope=openid+email+profile&nonce=${nonce}&redirect_uri=${redirectUri}&client_id=${clientId}`
    const loginUrl = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20email&nonce=${nonce}`;
    // Save the ephemeralKeyPair in local storage
    storeEphemeralKeyPair(ephemeralKeyPair);

    // window.location.href = loginUrl
    window.location.href = loginUrl
  }

  const finishKeylessAuth = async () => {

    console.log("finishKeylessAuth");

    setIsLoading(true);

    const jwt = parseJWTFromURL(window.location.href)
    // const jwt = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFjM2UzZTU1ODExMWM3YzdhNzVjNWI2NTEzNGQyMmY2M2VlMDA2ZDAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxODc1Mjg5MzkwOTAtb25mNHQ2bW9lcG1zbmZrbHQyZHNwY2Y4ODZhcjkwaGouYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIxODc1Mjg5MzkwOTAtb25mNHQ2bW9lcG1zbmZrbHQyZHNwY2Y4ODZhcjkwaGouYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDU1NzQyNzQzNjExNTM3NzE1ODgiLCJlbWFpbCI6ImphY2tsYXhqa0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibm9uY2UiOiIxMzc2Nzg4OTEzNzA5MDA5Njk2MjIyMjc2NTU0OTQ5ODc1MzE3NDIyNjUyNzA2NzU3MDcyNDUwODA4NTIzOTMzODc3MDA1NzI5NDEwMCIsIm5iZiI6MTcxNTE5Mjc5MCwibmFtZSI6IkphY2sgS2VsbHkiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSTVINDJQOFdjTlRRMWFkWEZXbWdTWmZWc3JjTk95TGJnZXpCZ1ZDU283aW10b2pRPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkphY2siLCJmYW1pbHlfbmFtZSI6IktlbGx5IiwiaWF0IjoxNzE1MTkzMDkwLCJleHAiOjE3MTUxOTY2OTAsImp0aSI6IjFhMjkzOWJmYThiNGJkNDE0M2Y5NTY0OGE3MTA2M2YwOWZlMDEzYjYifQ.m6eXKS74-gO11WXKGhmzXOnENWpDpj-xnOAnaWluCVHfYZqghUAez60qA-MvC8NN9klR1SlsQUmzA6Pt6UY6MFuWSvHh7peWQoo4788v7wC_UTsn7qoeDO9zRLCTxW6cNqA7oPoRYH69O6pS1CJO0JRxKvyvXEQ0ft2__Eyy2_7FD9ZSweeexBUtd3zmMUH7tR2KdTr5Xdm_g6uTgA-_scnlqTjqUbFAn_zZ_thGvkkK0D5eOzv93wczzq729EpjYsa7NStb-A0UApIIOL1UiARG3bAfJMGACsMpNuvNbltyi5mQYVSdtufQNeW-ULJELGH7W5ir86dvMmFtbSEVkg&authuser=1&prompt=consent&version_info=CmxfU1ZJX0VOWDM3NWJZX29VREdBUWlQMDFCUlVSSVpsOXhUMHhKTm5sQ1IzSkZkMnN6ZDBkbFFVVldabGhmVDFodGFHRlFVazFOUmxKWU1tSnRkVjlHYzFOak1VdFdPVkY2YlhsWVZ6Qllad18"
    // window.location.href="http://localhost:3000";
    if (!jwt) {
      console.log("No JWT found in URL")
      setIsLoading(false);
      return
    }
      const payload = jwtDecode<{ nonce: string }>(jwt);
      const jwtNonce = payload.nonce
      localStorage.setItem('jwt', jwt);
    const ephemeralKeyPair = getLocalEphemeralKeyPair(jwtNonce);

    if (!ephemeralKeyPair) {
      console.log("No ephemeral key pair found in local storage")
      setIsLoading(false);
      return
    }
    const keylessAccount = await aptos.deriveKeylessAccount({
      jwt,
      ephemeralKeyPair,
    });
    
    
    console.log("keylessAccount", keylessAccount);
    console.log("k",keylessAccount.publicKey.toString())
    // console.log("AFTER",new AptosAccount(address:keylessAccount.accountAddress))
    setKeylessAccount(keylessAccount);
    setIsLoggedIn(true);
    

    const userAddress = keylessAccount.accountAddress.toString();
    console.log("dddd",userAddress);
    setUpAndGetUser(
      {
        address: userAddress,
      },
      keylessAccount
    ).then((user) => {
      if (user) {
        console.log("User info", user);
        setUserInfo(user);
      }
    });

    setIsLoading(false);

  }

  const logOut = async () => {
    setKeylessAccount(null);
    setIsLoggedIn(false);
    setUserInfo(null);

    // Clear the ephemeral key pair from localStorage
    localStorage.clear()
    const keyPairs = getLocalEphemeralKeyPairs();
    for (const nonce in keyPairs) {
      removeEphemeralKeyPair(nonce);
    }
  }

  const parseJWTFromURL = (url: string): string | null => {
    const urlObject = new URL(url);
    const fragment = urlObject.hash.substring(1);
    const params = new URLSearchParams(fragment);
    return params.get('id_token');
  };

  /**
   * Retrieve all ephemeral key pairs from localStorage and decode them. The new ephemeral key pair
   * is then stored in localStorage with the nonce as the key.
   */
  const storeEphemeralKeyPair = (
    ephemeralKeyPair: EphemeralKeyPair,
  ): void => {
    // Retrieve the current ephemeral key pairs from localStorage
    const accounts = getLocalEphemeralKeyPairs();

    // Store the new ephemeral key pair in localStorage
    accounts[ephemeralKeyPair.nonce] = ephemeralKeyPair;
    localStorage.setItem(
      "ephemeral-key-pairs",
      encodeEphemeralKeyPairs(accounts),
    );
  };

  /**
   * Retrieve all ephemeral key pairs from localStorage and decode them.
   */
  const getLocalEphemeralKeyPairs = (): StoredEphemeralKeyPairs => {
    const rawEphemeralKeyPairs = localStorage.getItem("ephemeral-key-pairs");
    console.log("Raw pairs", rawEphemeralKeyPairs);
   
    try {
      return rawEphemeralKeyPairs
        ? decodeEphemeralKeyPairs(rawEphemeralKeyPairs)
        : {};
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        "Failed to decode ephemeral key pairs from localStorage",
        error,
      );
      return {};
    }
  };

  /**
   * Retrieve the ephemeral key pair with the given nonce from localStorage.
   */
  const getLocalEphemeralKeyPair = (
    nonce: string,
  ): EphemeralKeyPair | null => {
    const keyPairs = getLocalEphemeralKeyPairs();

    // Get the account with the given nonce (the generated nonce of the ephemeral key pair may not match
    // the nonce in localStorage), so we need to validate it before returning it (implementation specific).
    const ephemeralKeyPair = keyPairs[nonce];
    if (!ephemeralKeyPair) return null;

    // If the account is valid, return it, otherwise remove it from the device and return null
    return validateEphemeralKeyPair(nonce, ephemeralKeyPair);
  };

  /**
   * Validate the ephemeral key pair with the given nonce and the expiry timestamp. If the nonce does not match
   * the generated nonce of the ephemeral key pair, the ephemeral key pair is removed from localStorage. This is
   * to validate that the nonce algorithm is the same (e.g. if the nonce algorithm changes).
   */
  const validateEphemeralKeyPair = (
    nonce: string,
    ephemeralKeyPair: EphemeralKeyPair,
  ): EphemeralKeyPair | null => {
    // Check the nonce and the expiry timestamp of the account to see if it is valid
    if (
      nonce === ephemeralKeyPair.nonce &&
      ephemeralKeyPair.expiryDateSecs > BigInt(Math.floor(Date.now() / 1000))
    ) {
      return ephemeralKeyPair;
    }
    removeEphemeralKeyPair(nonce);
    return null;
  };

  /**
   * Remove the ephemeral key pair with the given nonce from localStorage.
   */
  const removeEphemeralKeyPair = (nonce: string): void => {
    const keyPairs = getLocalEphemeralKeyPairs();
    delete keyPairs[nonce];
    localStorage.setItem(
      "ephemeral-key-pairs",
      encodeEphemeralKeyPairs(keyPairs),
    );
  };

  /**
   * Encoding for the EphemeralKeyPair class to be stored in localStorage
   */
  const EphemeralKeyPairEncoding = {
    decode: (e: any) =>
      new EphemeralKeyPair({
        blinder: new Uint8Array(e.blinder),
        expiryDateSecs: BigInt(e.expiryDateSecs),
        privateKey: new Ed25519PrivateKey(e.privateKey),
      }),
    encode: (e: EphemeralKeyPair) => ({
      __type: "EphemeralKeyPair",
      blinder: Array.from(e.blinder),
      expiryDateSecs: e.expiryDateSecs.toString(),
      privateKey: e.privateKey.toString(),
    }),
  };

  /**
   * Stringify the ephemeral key pairs to be stored in localStorage
   */
  const encodeEphemeralKeyPairs = (
    keyPairs: StoredEphemeralKeyPairs,
  ): string =>
    JSON.stringify(keyPairs, (_, e) => {
      if (typeof e === "bigint") return { __type: "bigint", value: e.toString() };
      if (e instanceof EphemeralKeyPair)
        return EphemeralKeyPairEncoding.encode(e);
      return e;
    });

  /**
   * Parse the ephemeral key pairs from a string
   */
  const decodeEphemeralKeyPairs = (
    encodedEphemeralKeyPairs: string,
  ): StoredEphemeralKeyPairs =>
    JSON.parse(encodedEphemeralKeyPairs, (_, e) => {
      if (e && e.__type === "bigint") return BigInt(e.value);
      if (e && e.__type === "EphemeralKeyPair")
        return EphemeralKeyPairEncoding.decode(e);
      return e;
    });

  return (
    <keylessContext.Provider value={{
      keylessAccount,
      userInfo,
      isLoggedIn,
      isLoading,
      logIn: beginKeylessAuth,
      logOut: logOut
    }}>
      {children}
    </keylessContext.Provider>
  )
}