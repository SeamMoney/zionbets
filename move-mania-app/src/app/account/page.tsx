'use client';

import { useContext, useEffect, useState } from "react";
import { keylessContext } from "../KeylessProvider";
import Image from 'next/image';
import Quests from "./quests";
import { quests } from "./questInfo";
import AccountStats from "./accountStats";
import ReferralSection from "./referral";
import { FaEdit } from "react-icons/fa";
import { iconButton } from "../TailwindBase";

export default function AccountPage() {

  const { isLoggedIn, userInfo, logOut } = useContext(keylessContext);
// create dummy user object if userInfo is null
  const user = userInfo || {
    username: "user123",
    email: "jkdev222@gmail.com",
    image: "/defaultProfile.png",
    public_address: "0x1234",
    private_key: "0x1234",
    balance: 100,
  };

  type ReferralInfo = {
    referralCode: string;
    referralCount: number;
  };
  const [username, setUsername] = useState("");
  const defaultImage = '/defaultProfile.png';
  const [referrals, setReferrals] =useState<ReferralInfo>({
    referralCode: "12345",
    referralCount: 0,
  }); 
  const onSubmit = async () => {
    // if (!account) return;

    // const newUsername = username == "" ? account?.username : username;

    // const user: User = {
    //   username: newUsername,
    //   email: account.email,
    //   image: account.image,
    //   public_address: account.public_address,
    //   private_key: account.private_key,
    //   balance: account.balance,
    // };

    // await updateUser(account.email, user);
    
    // window.location.reload();
  };

  // if (!isLoggedIn || !userInfo) return <></>;

  return (
    <div className="px-2 pt-4 bg-black">
      <p className="text-center text-6xl text-bold pb-6">Dashboard</p>
      <div className="flex flex-row justify-left">
        <div className="rounded-xl">
          <Image
            className="rounded-full"
            src={defaultImage}
            width={100}
            height={100}
            alt="Picture of the author"
          />

        </div>
        <div>
          <UsernameItem/>
          <AddressItem/>

        </div>
          

      </div>
      
      {/* <AccountStats account={userInfo}/> */}
      
      <div className="grid gap-4 py-4">
        <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
          <label htmlFor="username" className="text-left ">
            Username
          </label>
          {/* <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
            <input
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              placeholder={userInfo.username}
              className="bg-transparent border-none outline-none text-right text-ellipsis"
            />
          </span> */}
        </div>
        <div className="border border-neutral-700 bg-neutral-800/20 bg-noise flex flex-row justify-between px-4 py-2">
          
          <span className=" opacity-50 flex flex-row justify-center items-center gap-1">
            {/* <input
              id="profile_pic"
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
              }}
              placeholder={account.image}
              className="bg-transparent border-none outline-none text-right text-ellipsis"
            /> */}
          </span>
          
        </div>
  
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
              value={userInfo.address || ''}
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
      <AccountStats account={null}/>
      <div>
      </div>
      <ReferralSection referralCode={referrals.referralCode} referralCount={referrals.referralCount} />
      <Quests quests={quests} />
      {/* <div className="flex flex-col items-center gap-2 w-full">
        <button
          type="submit"
          className="border border-neutral-700 hover:bg-neutral-800/80 hover:bg-noise px-6 py-1 text-neutral-500 w-full active:scale-95 active:opacity-50 transition-transform"
          onClick={logOut}
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
      </div> */}
    </div>
  )
  function UsernameItem() {
    return (
      <div className="flex flex-row justify-left ml-4">
        <span className="text-4xl font-bold">{user.username}</span>
        <div className={iconButton}>
          <FaEdit />
        </div>

      </div>
    )
  }

  function AddressItem(){
    return (
      <div className="flex flex-col justify-center ml-4">
        <span className="text-4xl font-bold">{user.username||'0x0'}</span>
        {/* <span className="text-xl opacity-50">Public Address</span> */}
      </div>
    )
  }
}
