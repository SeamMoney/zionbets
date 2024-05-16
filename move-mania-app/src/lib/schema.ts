export type User = {
  address: string;
  username: string;
  referral_code: string;
  referred_by: string | null;
};

export const UserSchema = `CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  image TEXT,
  email TEXT,
  public_address TEXT,
  private_key TEXT
)`;
