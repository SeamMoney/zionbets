import { open } from "sqlite";
import { UserSchema } from "./schema";

export async function initializeUsersTable() {
  const db = await open({
    filename: './db/users.db',
    driver: require('sqlite3').Database
  })

  await db.exec(UserSchema);
}