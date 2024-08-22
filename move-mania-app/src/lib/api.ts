import { PlayerState } from "@/app/playerList";
import { fundAccountWithGas, mintZAPT, registerForZAPT, createAptosKeyPair } from "./aptos";
import { User } from "./schema";
import { ChatMessage } from "./types";
import { MagicAptosWallet } from "@magic-ext/aptos";
import { MultiKeyAccount, Account } from "@aptos-labs/ts-sdk";

const API_URL = `${process.env.ZION_API_URL || 'http://localhost:3008'}`;
export async function getUsers() {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    return response.json();
  } catch (e) {
    return [];
  }
}

export async function doesUserExist(email: string) {
  try {
    const response = await fetch(`${API_URL}/users/${email}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

export async function setUpUser(
  userToSetup: Omit<User, "public_address" | "private_key" | "balance" | "referral_code">,
  referrer?: string
) {
  if (referrer) {
    const referrerUser = await getUserFromReferralCode(referrer);
    await mintZAPT(referrerUser.public_address, 100);
  }

  const keyPair = await createAptosKeyPair();
  if (!keyPair) {
    console.error('Failed to create Aptos key pair');
    return false;
  }

  await fundAccountWithGas(keyPair.public_address);
  await mintZAPT(keyPair.public_address, 1000);

  const newUser = {
    ...userToSetup,
    public_address: keyPair.public_address,
    private_key: keyPair.private_key,
    balance: 1000,
    referral_code: keyPair.public_address.slice(2, 8),
  };

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
      body: JSON.stringify(newUser),
    });
    return response.ok;
  } catch (e) {
    console.log('error setting up user', e)
    return false;
  }
}

export async function getUserFromReferralCode(referralCode: string) {
  try {
    const response = await fetch(`${API_URL}/users/referral/code/${referralCode}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    return response.json();
  }
  catch (e) {
    return null;
  }
}

export async function getUser(email: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/users/${email}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    return response.json();
  } catch (e) {
    return null;
  }
}

export async function setUpAndGetUser(
  userToSetup: Omit<User, "public_address" | "private_key" | "balance">,
  referrer?: string
): Promise<User | null> {
  console.log('userToSetup', userToSetup)
  const userExists = await doesUserExist(userToSetup.email);
  console.log('userExists', userExists);
  if (!userExists) {
    const res = await setUpUser(userToSetup, referrer);
    console.log('res from setting up user', res)
    if (res) {
      return getUser(userToSetup.email);
    } else {
      return null;
    }
  } else {
    return getUser(userToSetup.email);
  }
}

export async function updateUser(email: string, user: User): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/users/${email}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
      body: JSON.stringify(user),
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    const res = await response.json();
    return res.map((message: any) => ({
      message: message.message,
      authorEmail: message.user_id,
      authorUsername: message.username,
    }));
  } catch (e) {
    return [];
  }
}

export async function getPlayerList(): Promise<PlayerState[]> {
  try {
    const response = await fetch(`${API_URL}/playerlist`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    const res = await response.json();
    return res.map((player: any) => ({
      username: player.username,
      betAmount: player.bet_amount,
      cashOutMultiplier: player.crash_point,
      coinType: player.bet_type,
    }));
  } catch (e) {
    return [];
  }
}

export async function getCurrentGame() {
  try {
    // console.log('getting game from api')
    const response = await fetch(`${API_URL}/games/current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    // console.log('response', response)
    const res = await response.json();
    // console.log('res', res)
    return res;
  } catch (e) {
    console.log('error getting game', e)
    return null;
  }
}

export async function clearGames() {
  try {
    const response = await fetch(`${API_URL}/games`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

export async function getUserBalance(email: string) {
  try {
    const response = await fetch(`${API_URL}/users/balance/${email}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    const res = await response.json();
    return res.balance;
  } catch (e) {
    return 0;
  }
}

export async function hasUserBet(email: string) {
  try {
    const response = await fetch(`${API_URL}/playerlist/${email}/hasbet`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    return response.json();
  } catch (e) {
    return false;
  }
}

export async function hasUserCashOut(email: string) {
  try {
    const response = await fetch(`${API_URL}/playerlist/${email}/hascashout`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    return response.json();
  } catch (e) {
    return false;
  }
}
