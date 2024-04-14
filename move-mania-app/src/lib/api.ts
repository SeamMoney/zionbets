import { PlayerState } from "@/app/playerList";
import { createAptosKeyPair, mintZAPT } from "./aptos";
import { User, UserV2 } from "./schema";
import { ChatMessage } from "./types";

const API_URL = `${process.env.ZION_API_URL || 'http://localhost:3008'}/v2`;
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

export async function doesUserExist(address: string) {
  try {
    const response = await fetch(`${API_URL}/users/${address}`, {
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
  userToSetup: Omit<UserV2, "referred_by" | "referral_code" | "username">,
  referrer?: string
) {

  // if (referrer) {

  //   const referrerUser = await getUserFromReferralCode(referrer);

  //   mintZAPT(referrerUser.private_key, 100);
  // }

  // const keyPair = await createAptosKeyPair();

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "api-key": process.env.ZION_API_KEY || "",
      },
      body: JSON.stringify({
        address: userToSetup.address,
        username: userToSetup.address.slice(0, 8),
        referral_code: userToSetup.address.slice(2, 8),
        referred_by: referrer || null,
      }),
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

export async function getUser(address: string): Promise<UserV2 | null> {
  try {
    const response = await fetch(`${API_URL}/users/${address}`, {
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
  userToSetup: Omit<UserV2, "referred_by" | "referral_code" | "username">, 
  referrer?: string
): Promise<UserV2 | null> {
  const userExists = await doesUserExist(userToSetup.address);
  console.log('userExists', userExists);
  if (!userExists) {
    const res = await setUpUser(userToSetup, referrer);
    console.log('res from setting up user', res)
    if (res) {
      return getUser(userToSetup.address);
    } else {
      return null;
    }
  } else {
    return getUser(userToSetup.address);
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
    const response = await fetch(`${API_URL}/games/current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.ZION_API_KEY || "",
      },
    });
    const res = await response.json();
    return res;
  } catch (e) {
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
