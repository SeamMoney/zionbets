'use client';

import { getUser, setUpAndGetUser, updateUser } from "@/lib/api";
import { User } from "@/lib/schema";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import { useContext, useEffect, useState } from "react";
import { gameStatusContext } from "../CrashProvider";
import { magicLogout } from "@/lib/magic";
import { magicContext } from "../MagicProvider";


export default function AccountPage() {

  const { account } = useContext(gameStatusContext);
  const { isLoggedIn, setIsLoggedIn } = useContext(magicContext);
  // const [account, setAccount] = useState<User | null>(null);

  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);

  const [username, setUsername] = useState("");

  // useEffect(() => {
  //   getSession().then((session) => {
  //     if (session) {
  //       if (!session.user || !session.user.email) return;

  //       getUser(
  //         session.user.email
  //       ).then((user) => {
  //         if (user) {
  //           setAccount(user);
  //         }
  //       });
  //     }
  //   });
  // }, []);

  const onSubmit = async () => {
    if (!account) return;

    const newUsername = username == "" ? account?.username : username;

    const user: User = {
      username: newUsername,
      email: account.email,
      image: account.image,
      public_address: account.public_address,
      private_key: account.private_key,
      balance: account.balance,
    };

    await updateUser(account.email, user);
    
    window.location.reload();
  };

  if (!isLoggedIn) return <></>;

  return (
    <div className="px-2 pt-4">
      <div>
        <input type="text" autoFocus className="hidden" />
        <span className="text-lg">Edit profile</span>
        <p className="text-sm opacity-50">
          Make changes to your profile here. Click save when you&apos;re
          done.
        </p>
      </div>
      <div className="grid gap-4 py-4">
        {/* <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
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
              placeholder={account.username}
              className="bg-transparent border-none outline-none text-right text-ellipsis"
            />
          </span>
        </div> */}
        {/* <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
          <label htmlFor="profile_pic" className="text-left ">
            Profile picture
          </label>
          <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
            <input
              id="profile_pic"
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
              }}
              placeholder={account.image}
              className="bg-transparent border-none outline-none text-right text-ellipsis"
            />
          </span>
        </div> */}
        {/* <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
          <label htmlFor="email" className="text-left ">
            Email
          </label>
          <span className=" opacity-50 flex flex-row justify-end items-center gap-1">
            <input
              id="email"
              disabled
              value={account.email}
              className="bg-transparent border-none outline-none text-right text-ellipsis cursor-not-allowed"
            />
          </span>
        </div> */}
        {/* <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
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
              value={account.public_address}
              className="bg-transparent border-none outline-none text-right text-ellipsis cursor-not-allowed"
            />
          </span>
        </div> */}
        {/* <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
          <label
            htmlFor="private_key"
            className=" font-light w-[100px]"
          >
            Private key
          </label>
          <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
            <input
              id="private_key"
              hidden={!privateKeyVisible}
              disabled
              value={account.private_key}
              className="bg-transparent border-none outline-none text-right text-ellipsis w-[170px] cursor-not-allowed"
            />
            {!privateKeyVisible ? (
              <EyeIcon
                className="cursor-pointer"
                onClick={() => setPrivateKeyVisible(true)}
              />
            ) : (
              <EyeOffIcon
                className="cursor-pointer"
                onClick={() => setPrivateKeyVisible(false)}
              />
            )}
          </span>
        </div> */}
      </div>
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          type="submit"
          className="border border-neutral-700 hover:bg-neutral-800/80 hover:bg-noise px-6 py-1 text-neutral-500 w-full active:scale-95 active:opacity-50 transition-transform"
          onClick={async () => {await magicLogout(); setIsLoggedIn(false);}}
        >
          Sign out
        </button>
          <button
            type="submit"
            className="border border-green-700 hover:bg-[#264234]/40 hover:bg-noise px-6 py-1 text-green-500 w-full active:scale-95 active:opacity-50 transition-transform"
            onClick={onSubmit}
          >
            Save changes
          </button>
      </div>
    </div>
  )
}