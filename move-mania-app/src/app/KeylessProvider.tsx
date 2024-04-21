'use client';

import { Aptos, AptosConfig, Ed25519PrivateKey, EphemeralKeyPair, MultiKeyAccount, Network } from "@aptos-labs/ts-sdk";
import { createContext, useEffect, useState } from "react";
import { jwtDecode } from 'jwt-decode';
import { User } from "@/lib/schema";
import { setUpAndGetUser } from "@/lib/api";

  /**
 * Stored ephemeral key pairs in localStorage (nonce -> ephemeralKeyPair)
 */
  export type StoredEphemeralKeyPairs = { [nonce: string]: EphemeralKeyPair };

interface KeylessProviderProps {
  keylessAccount: MultiKeyAccount | null;
  userInfo: User | null;
  isLoggedIn: boolean;
  logIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

export const keylessContext = createContext<KeylessProviderProps>({
  keylessAccount: null,
  userInfo: null,
  isLoggedIn: false,
  logIn: async () => {},
  logOut: async () => {}
});

export default function KeylessProvider({ children }: { children: React.ReactNode }) {

  const [keylessAccount, setKeylessAccount] = useState<MultiKeyAccount | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);


  useEffect(() => {
    console.log("KeylessProvider mounted");
    finishKeylessAuth();
  }, [])

  const beginKeylessAuth = async () => {
    console.log("beginKeylessAuth");

    const ephemeralKeyPair = EphemeralKeyPair.generate();
    const redirectUri = 'http://localhost:3000'
    const clientId = process.env.GOOGLE_CLIENT_ID!
    // Get the nonce associated with ephemeralKeyPair
    const nonce = ephemeralKeyPair.nonce

    const loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&scope=openid+email+profile&nonce=${nonce}&redirect_uri=${redirectUri}&client_id=${clientId}`

    // Save the ephemeralKeyPair in local storage
    storeEphemeralKeyPair(ephemeralKeyPair);

    window.location.href = loginUrl
  }

  const finishKeylessAuth = async () => {
    console.log("finishKeylessAuth");

    const jwt = parseJWTFromURL(window.location.href)
    if (!jwt) {
      console.log("No JWT found in URL")
      return
    }
    const payload = jwtDecode<{ nonce: string }>(jwt);
    const jwtNonce = payload.nonce
    const ephemeralKeyPair = getLocalEphemeralKeyPair(jwtNonce);

    if (!ephemeralKeyPair) {
      console.log("No ephemeral key pair found in local storage")
      return
    }

    const aptos = new Aptos(new AptosConfig({network: Network.DEVNET}));  // Only devnet supported as of now.
    const keylessAccount = await aptos.deriveKeylessAccount({
      jwt,
      ephemeralKeyPair,
    });

    console.log("keylessAccount", keylessAccount);
    setKeylessAccount(keylessAccount);
    setIsLoggedIn(true);

    const userAddress = keylessAccount.accountAddress.toString();
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

  }

  const logOut = async () => {
    setKeylessAccount(null);
    setIsLoggedIn(false);
    setUserInfo(null);

    // Clear the ephemeral key pair from localStorage
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
      logIn: beginKeylessAuth,
      logOut
    }}>
      {children}
    </keylessContext.Provider>
  )
}