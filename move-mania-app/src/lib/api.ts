import { PlayerState } from "@/app/crash/playerList";
import { createAptosKeyPair } from "./aptos";
import { User } from "./schema"
import { ChatMessage } from "./types";

const API_URL = process.env.API_URL || 'http://localhost:3008'

export async function doesUserExist(username: string) { 

  console.log(`${API_URL}/users/${username}`)

  try {
    const response = await fetch(
      `${API_URL}/users/${username}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.ok
  } catch (e) {
    return false
  }
}

export async function setUpUser(userToSetup: Omit<User, "public_address" | "private_key">) {
  
  const keyPair = await createAptosKeyPair();
  console.log(keyPair)

  console.log(userToSetup)

  console.log(`${API_URL}/users`)

  try {
    const response = await fetch(
      `${API_URL}/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userToSetup,
          ...keyPair
        })
      }
    )
    return response.ok
  } catch (e) {
    return false
  }
}

export async function getUser(email: string): Promise<User | null> {

  console.log(`${API_URL}/users/${email}`)

  try {
    const response = await fetch(
      `${API_URL}/users/${email}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.json()
  } catch (e) {
    return null
  }
}

export async function setUpAndGetUser(userToSetup: Omit<User, "public_address" | "private_key">): Promise<User | null> {
  const userExists = await doesUserExist(userToSetup.email)
  if (!userExists) {
    const res = await setUpUser(userToSetup)
    if (res) {
      return getUser(userToSetup.email)
    } else {
      return null
    }
  } else {
    return getUser(userToSetup.email)
  }
}

export async function updateUser(email: string, user: User): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_URL}/users/${email}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      }
    )
    return response.ok
  } catch (e) {
    return false
  }
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  try {
    const response = await fetch(
      `${API_URL}/chat`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    const res = await response.json()
    return res.map((message: any) => ({
      message: message.message,
      authorEmail: message.user_id,
      authorUsername: message.username,
    }))
  } catch (e) {
    return []
  }
}

export async function getPlayerList(): Promise<PlayerState[]> {
  try {
    const response = await fetch(
      `${API_URL}/playerlist`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    const res = await response.json()
    return res.map((player: any) => ({
      username: player.username,
      betAmount: player.bet_amount,
      cashOutMultiplier: player.crash_point,
      coinType: player.bet_type,
    }));
  } catch (e) {
    return []
  }
}