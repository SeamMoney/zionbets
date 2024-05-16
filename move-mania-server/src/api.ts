import express from "express";
import {
  addChatMessage,
  clearGames,
  clearPlayerList,
  createUser,
  deleteUser,
  getChatMessages,
  getCurrentGame,
  getGames,
  getPlayerList,
  getUser,
  getUserByReferralCode,
  getUsers,
  hasUserBet,
  hasUserCashOut,
  updateUser,
} from "./database";
import { SOCKET_EVENTS } from "./types";
require('dotenv').config();
var cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.ZION_APP_URL || "http://localhost:3000",
}));

const PORT = 3008;

const server = io("http://localhost:8080")
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
  server.emit(SOCKET_EVENTS.START_ROUND)
});
