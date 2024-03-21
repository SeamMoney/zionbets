export type User = {
  address: string;
  username: string;
  phone: string;
};

export const UserSchema = `CREATE TABLE IF NOT EXISTS users (
  address TEXT PRIMARY KEY,
  username TEXT default NULL
)`;
