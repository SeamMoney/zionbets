export type User = {
  username: string;
  image: string;
  email: string;
  public_address: string;
  private_key: string;
  balance: number;
  address: string;
  referral_code: string;
  referred_by: string | null;
};

export const UserSchema = `CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  image TEXT,
  email TEXT,
  public_address TEXT,
  private_key TEXT,
  balance REAL,
  address TEXT,
  referral_code TEXT,
  referred_by TEXT
)`;