'use client';

import { setUpAndGetUser, updateUser } from "@/lib/api";
import { magic, magicLogin, magicLogout } from "@/lib/magic";
import { User } from "@/lib/schema";
import { ChevronDown, EyeIcon, EyeOffIcon } from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import { magicContext } from "../MagicProvider";
import { cn } from "@/lib/utils";
import { COUNTRY_CODES } from "@/lib/utils";
import { count } from "console";


export default function AccountPage() {

  const [account, setAccount] = useState<User | null>(null);

  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);

  const [username, setUsername] = useState("");
  const [image, setImage] = useState("");

  const { isLoggedIn, userInfo, setIsLoggedIn, setUserInfo } = useContext(magicContext);

  const [ phone, setPhone ] = useState<string>('');

  const handleLogin = async () => {
    console.log('logging in')

    const deformatedPhone = phone.replace(/[^0-9]/g, '');
    if (deformatedPhone.length < 10) {
      console.error('Invalid phone number');
      return;
    }

    console.log('deformatedPhone', deformatedPhone)

    const countryIso = (document.getElementById('countries') as any).value;
    const countryCode = COUNTRY_CODES.find((country) => country.iso === countryIso)?.code;

    const res = await magicLogin(`+${countryCode}${deformatedPhone}`);
    console.log('res', res)

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
  }

  /**
   *
   * @param phone the phone number to format
   * 
   * @returns the formatted phone number in the format (210)555-0123. If the phone number is less 
   * than 10 digits, it will return the phone number as formatted as possible. Such as (210)5 or
   * (210)555-012 or (21
   */
  const formatPhoneNumberInput = (phone: string) => {
    const formatted = phone.replace(/[^0-9]/g, '');
    if (formatted.length < 4) {
      return `(${formatted}`;
    } else if (formatted.length < 7) {
      return `(${formatted.slice(0, 3)})${formatted.slice(3)}`;
    } else {
      return `(${formatted.slice(0, 3)})${formatted.slice(3, 6)}-${formatted.slice(6, 10)}`;
    }
  }

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        if (!session.user) return;

        setUpAndGetUser({
          username: session.user.name || "",
          image: session.user.image || "",
          email: session.user.email || "",
        }).then((user) => {
          if (user) {
            setAccount(user);
          }
        });
      }
    });
  }, []);

  const onSubmit = async () => {
    const newUsername = username == "" ? account?.username : username;
    const newImage = image == "" ? account?.image : image;

    const user: User = {
      username: newUsername || "",
      email: account?.email || "",
      image: newImage || "",
      public_address: account?.public_address || "",
      private_key: account?.private_key || "",
      balance: account?.balance || 0,
    };

    await updateUser(account?.email || "", user);

    setAccount(user);
  };

  if (isLoggedIn === null) return (
    <div className="px-2 pt-4">
      <span className="text-lg">Loading...</span>
    </div>
  )

  if (!isLoggedIn || !userInfo) return (
    <div className="px-2 pt-4">
      <span className="text-lg">Get access to your Zion Bets account</span>
      <p className="text-sm opacity-50">
        Enter your phone number to receive your one-time sign in code.
      </p>
      <div className="flex flex-col items-end w-full w-full gap-2 mt-8">
        <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2 w-full">
          <label
            htmlFor="public_address"
            className="text-left "
          >
            Phone
          </label>
          <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
            <select name="countries" id="countries" defaultValue="US" className="bg-transparent text-right focus:ring-none focus:outline-0 max-w-[100px]">
              {
                COUNTRY_CODES.map((country) => {
                  return (
                    <option key={country.code} value={country.iso} className="flex flex-row items-center justify-end text-right">
                      <span className="text-right">{country.iso} +{country.code} </span><ChevronDown className="w-4"/>
                    </option>
                  )
                })
              }
            </select>
            <input
              id="public_address"
              placeholder="(210)555-0123"
              value={formatPhoneNumberInput(phone)}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-transparent border-none outline-none text-left text-ellipsis"
              autoFocus
              inputMode="numeric"
            />
          </span>
        </div>
        <button 
          className={cn(
            "border border-yellow-700 px-6 py-1 text-yellow-500 bg-neutral-950",
            // parseFloat(transferAmount) > 0 && balance && parseFloat(transferAmount) <= balance && recipientAddress != '' && 'bg-[#404226]/40'
          )}
          onClick={handleLogin}
        >
          Submit
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-2 pt-4">
      <div>
        {/* <input type="text" autoFocus className="hidden" /> */}
        <span className="text-lg">Edit profile</span>
        <p className="text-sm opacity-50">
          Make changes to your profile here. Click save when you&apos;re
          done.
        </p>
      </div>
      <div className="grid gap-4 py-4">
        <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
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
              // placeholder={account.username}
              className="bg-transparent border-none outline-none text-right text-ellipsis"
            />
          </span>
        </div>
        <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
          <label htmlFor="email" className="text-left ">
            Phone Number
          </label>
          <span className=" opacity-50 flex flex-row justify-end items-center gap-1">
            <input
              id="email"
              disabled
              value={userInfo.phoneNumber}
              className="bg-transparent border-none outline-none text-right text-ellipsis cursor-not-allowed"
            />
          </span>
        </div>
        <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
          <label
            htmlFor="public_address"
            className="text-left "
          >
            Public address
          </label>
          <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
            <input
              id="public_address"
              disabled
              value={userInfo.publicAddress}
              className="bg-transparent border-none outline-none text-right text-ellipsis cursor-not-allowed"
            />
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          type="submit"
          className="border border-neutral-700 hover:bg-neutral-800/80 hover:bg-noise px-6 py-1 text-neutral-500 w-full"
          onClick={async () => {
            await magicLogout();
            setIsLoggedIn(false);
            setUserInfo(null);
          }}
        >
          Sign out
        </button>
          <button
            type="submit"
            className="border border-green-700 hover:bg-[#264234]/40 hover:bg-noise px-6 py-1 text-green-500 w-full"
            onClick={onSubmit}
          >
            Save changes
          </button>
      </div>
    </div>
  )
}