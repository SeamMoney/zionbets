import { open } from "sqlite";
import { User, UserSchema } from "./schema";
import crypto from 'crypto';

export async function initializeUsersTable() {
  const db = await open({
    filename: './db/users.db',
    driver: require('sqlite3').Database
  })

  await db.exec(UserSchema);
}

export async function getUsers() {
  await initializeUsersTable(); // Initialize the users table if it doesn't exist

  // Open the database
  const db = await open({
    filename: './db/users.db',
    driver: require('sqlite3').Database
  })

  // Get all the users
  const users = await db.all('SELECT * FROM users') as User[];

  await db.close();

  return users;

}

export async function createUser(user: User) {

  await initializeUsersTable(); // Initialize the users table if it doesn't exist

  // Open the database
  const db = await open({
    filename: './db/users.db',
    driver: require('sqlite3').Database
  })

  await db.run(
    'INSERT INTO users (username, image, email, public_address, private_key) VALUES (?, ?, ?, ?, ?)', 
    user.username, 
    user.image, 
    user.email, 
    user.public_address, 
    user.private_key
  );

  await db.close();
}

export async function getUser(username: string) {
  await initializeUsersTable(); // Initialize the users table if it doesn't exist

  // Open the database
  const db = await open({
    filename: './db/users.db',
    driver: require('sqlite3').Database
  })

  // Get the user with the given username
  const user = await db.get('SELECT * FROM users WHERE username = ?', username) as User | undefined;

  await db.close();

  return user;
}

export async function updateUser(username: string, user: User) {
  await initializeUsersTable(); // Initialize the users table if it doesn't exist

  // Open the database
  const db = await open({
    filename: './db/users.db',
    driver: require('sqlite3').Database
  })

  await db.run(
    'UPDATE users SET image = ?, email = ?, public_address = ?, private_key = ? WHERE username = ?', 
    user.image, 
    user.email, 
    user.public_address, 
    user.private_key,
    username
  );

  await db.close();
}

export async function deleteUser(username: string) {
  await initializeUsersTable(); // Initialize the users table if it doesn't exist

  // Open the database
  const db = await open({
    filename: './db/users.db',
    driver: require('sqlite3').Database
  })

  await db.run('DELETE FROM users WHERE username = ?', username);

  await db.close();
}

export async function initializeApiKeyTable() {
  const db = await open({
    filename: './db/api_keys.db',
    driver: require('sqlite3').Database
  })

  await db.exec('CREATE TABLE IF NOT EXISTS api_keys (username TEXT PRIMARY KEY, api_key TEXT)');

  await db.close();

}

export async function createKeyForUser(username: string) {
  initializeApiKeyTable(); // Initialize the api_keys table if it doesn't exist

  // Open the database
  const db = await open({
    filename: './db/api_keys.db',
    driver: require('sqlite3').Database
  })

  // Generate a random API key
  const apiKey = crypto.randomBytes(32).toString('hex');

  await db.run('INSERT INTO api_keys (username, api_key) VALUES (?, ?)', username, apiKey);

  await db.close();
}

export async function isValidApiKey(apiKey: string) {
  initializeApiKeyTable(); // Initialize the api_keys table if it doesn't exist

  // Open the database
  const db = await open({
    filename: './db/api_keys.db',
    driver: require('sqlite3').Database
  })

  // Check if the API key exists
  const result = await db.get('SELECT * FROM api_keys WHERE api_key = ?', apiKey);

  await db.close();

  return result !== undefined;
}