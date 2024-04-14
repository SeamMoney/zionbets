import express from "express";
import {
  addChatMessage,
  clearGames,
  clearPlayerList,
  createUser,
  createUserV2,
  deleteUser,
  getChatMessages,
  getCurrentGame,
  getGames,
  getPlayerList,
  getUser,
  getUserBalance,
  getUserByReferralCode,
  getUserV2,
  getUsers,
  getUsersV2,
  hasUserBet,
  hasUserCashOut,
  updateUser,
} from "./database";
import { UserV2 } from "./schema";
require('dotenv').config();
var cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.ZION_APP_URL || "http://localhost:3000",
}));

const PORT = 3008;

/* =================================================================================================
  API v2
================================================================================================= */

/* 
  This is the entry point for the server. 
*/
app.get("/v2", (req, res) => {
  res.send("Hello from the Zion Bets server! (v2)");
});
/**
 * This is the endpoint to get all users
 */
app.get("/v2/users", async (req, res) => {

  const users = await getUsersV2();
  res.send(users);
});
/**'
 * Get user by address
 */
app.get("/v2/users/:address", async (req, res) => {

  const address = req.params.address;
  const user = await getUserV2(address);
  if (user) {
    res.send(user);
  } else {
    res.status(404).send("User not found");
  }
});
/**
 * Create a new user
 */
app.post("/v2/users", async (req, res) => {

  const user = req.body as UserV2;
  try {
    await createUserV2(user);
  } catch (e) {
    res.status(400).send("User already exists");
    return;
  }
  res.send("User created");
});

/* =================================================================================================
  API v1
================================================================================================= */

/* 
  This is the entry point for the server. 
*/
app.get("/", (req, res) => {
  res.send("Hello from the Move Mania server!");
});

/**
 * This is the endpoint to get all users
 */
app.get("/users", async (req, res) => {

  const users = await getUsers();
  res.send(users);
});
/**
 * This is the endpoint to get all games
 */
app.get("/games", async (req, res) => {


  const games = await getGames();
  res.send(games);
});
/**
 * This is the endpoint to get all playerlist
 */
app.get("/playerlist", async (req, res) => {

  const playerList = await getPlayerList();
  res.send(playerList);
});
/**
 * This is the endpoint to get all chat messages
 */
app.get("/chat", async (req, res) => {

  const chatMessages = await getChatMessages();
  res.send(chatMessages);
});

app.get("/users/referral/code/:code", async (req, res) => {
  const code = req.params.code;
  const user = await getUserByReferralCode(code);
  if (user) {
    res.send(user);
  } else {
    res.status(404).send("User not found");
  }
});

app.get("/users/:email", async (req, res) => {

  const email = req.params.email;
  const user = await getUser(email);
  if (user) {
    res.send(user);
  } else {
    res.status(404).send("User not found");
  }
});

app.get("/users/balance/:email", async (req, res) => {

  const email = req.params.email;
  const balance = await getUserBalance(email);
  res.send(balance);
});

app.get("/games/current", async (req, res) => {

  const game = await getCurrentGame();
  res.send(game);
});

app.delete("/games", async (req, res) => {

  await clearGames();
  res.send("Games cleared");
});

app.delete("/playerlist", async (req, res) => {

  await clearPlayerList();
  res.send("Player list cleared");
});

app.get("/playerlist/:email/hasbet", async (req, res) => {

  const email = req.params.email;
  const hasBet = await hasUserBet(email);
  res.send(hasBet);
});

app.get("/playerlist/:email/hascashout", async (req, res) => {

  const email = req.params.email;
  const hasCashOut = await hasUserCashOut(email);
  res.send(hasCashOut);
});

app.post("/users", async (req, res) => {

  const user = req.body;
  try {
    await createUser(user);
  } catch (e) {
    res.status(400).send("User already exists");
    return;
  }
  res.send("User created");
});

app.post("/chat", async (req, res) => {

  const chatMessage = req.body;
  await addChatMessage(chatMessage);
  res.send("Chat message added");
});

app.put("/users/:email", async (req, res) => {

  const email = req.params.email;
  const user = req.body;
  await updateUser(email, user);
  res.send("User updated");
});

app.delete("/users/:email", async (req, res) => {

  const email = req.params.email;
  await deleteUser(email);
  res.send("User deleted");
});

/* 
  The server will listen on port PORT
*/
app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
  console.log("CORS-enabled for ", process.env.ZION_APP_URL || "http://localhost:3000");
});
