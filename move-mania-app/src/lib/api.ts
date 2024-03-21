import { PlayerState } from "@/app/playerList";
import { createAptosKeyPair, fundAccountWithGas, mintUserZAPT } from "./aptos";
import { User } from "./schema";
import { ChatMessage } from "./types";

const API_URL = process.env.API_URL || "http://localhost:3008";

export async function doesUserExist(username: string) {
  console.log('sending response to', `${API_URL}/users/${username}`)
  try {
    const response = await fetch(`${API_URL}/users/${username}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (e) {
    console.log('error', e)
    return false;
  }
}

export async function setUpUser(
  userToSetup: Omit<User, 'username' | 'phone'>
) {
  console.log('setting up user', userToSetup)
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userToSetup),
    });
    return response.ok;
  } catch (e) {
    return false;
  }

  // await fundAccountWithGas(userToSetup.address);
  // await mintUserZAPT(userToSetup.address, 100);

  return true;
}

export async function getUser(email: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/users/${email}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  } catch (e) {
    return null;
  }
}

export async function setUpAndGetUser(
  userToSetup: Omit<User, 'username' | 'phone'>
): Promise<{username:string,address:string} | null> {
  console.log('checking if user exists', userToSetup.address)
  const userExists = await doesUserExist(userToSetup.address);
  console.log('user exists', userExists)
  if (!userExists) {
    console.log('setting up user')
    const res = await setUpUser(userToSetup);
    console.log('user set up', res)
    if (res) {
      console.log('getting user')
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
      },
    });
    const res = await response.json();
    return res;
  } catch (e) {
    return null;
  }
}

export async function getUserBalance(email: string) {
  try {
    const response = await fetch(`${API_URL}/users/balance/${email}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
      },
    });
    return response.json();
  } catch (e) {
    return false;
  }
}
