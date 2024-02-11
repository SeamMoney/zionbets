export type User = {
  username: string;
  image: string;
  email: string;
  public_address: string;
  private_key: string;
  balance: number;
};

export type Game = {
  id: string;
  start_time: string;
  secret_crash_point: number
}

export type PlayerListEntry = {
  user_id: string;
  bet_type: string;
  bet_amount: number;
  crash_point?: number;
}

export type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  sent_at: string;
}

export const UserSchema = `CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  username TEXT,
  image TEXT,
  public_address TEXT,
  private_key TEXT,
  balance FLOAT
)`;

export const GameSchema = `CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  start_time TEXT,
  secret_crash_point FLOAT
)`;

export const PlayerListSchema = `CREATE TABLE IF NOT EXISTS player_list (
  bet_type TEXT,
  bet_amount FLOAT,
  crash_point FLOAT,
  user_id TEXT PRIMARY KEY,
  FOREIGN KEY (user_id) REFERENCES users(email)
)`;

export const ChatMessageSchema = `CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  message TEXT,
  sent_at TEXT,
  user_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(email)
)`;

export const AllSchemas = [UserSchema, GameSchema, PlayerListSchema, ChatMessageSchema, ''].join(';\n');