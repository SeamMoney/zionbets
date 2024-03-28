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
  getUserBalance,
  getUsers,
  hasUserBet,
  hasUserCashOut,
  updateUser,
} from "./database";
require('dotenv').config();
var cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3008;

const authenticateKey = (req: any) => {
  const apiKey = req.headers["api-key"];
  console.log('apiKey', apiKey);
  console.log('process.env.ZION_API_KEY', process.env.ZION_API_KEY);
  return apiKey == process.env.ZION_API_KEY
};

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

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const users = await getUsers();
  res.send(users);
});
/**
 * This is the endpoint to get all games
 */
app.get("/games", async (req, res) => {
  
  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const games = await getGames();
  res.send(games);
});
/**
 * This is the endpoint to get all playerlist
 */
app.get("/playerlist", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const playerList = await getPlayerList();
  res.send(playerList);
});
/**
 * This is the endpoint to get all chat messages
 */
app.get("/chat", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const chatMessages = await getChatMessages();
  res.send(chatMessages);
});

app.get("/users/:email", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const email = req.params.email;
  const user = await getUser(email);
  if (user) {
    res.send(user);
  } else {
    res.status(404).send("User not found");
  }
});

app.get("/users/balance/:email", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const email = req.params.email;
  const balance = await getUserBalance(email);
  res.send(balance);
});

app.get("/games/current", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const game = await getCurrentGame();
  res.send(game);
});

app.delete("/games", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  await clearGames();
  res.send("Games cleared");
});

app.delete("/playerlist", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  await clearPlayerList();
  res.send("Player list cleared");
});

app.get("/playerlist/:email/hasbet", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const email = req.params.email;
  const hasBet = await hasUserBet(email);
  res.send(hasBet);
});

app.get("/playerlist/:email/hascashout", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const email = req.params.email;
  const hasCashOut = await hasUserCashOut(email);
  res.send(hasCashOut);
});

app.post("/users", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

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

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const chatMessage = req.body;
  await addChatMessage(chatMessage);
  res.send("Chat message added");
});

app.put("/users/:email", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const email = req.params.email;
  const user = req.body;
  await updateUser(email, user);
  res.send("User updated");
});

app.delete("/users/:email", async (req, res) => {

  if (!authenticateKey(req)) {
    res.status(401).send("Unauthorized");
    return;
  }

  const email = req.params.email;
  await deleteUser(email);
  res.send("User deleted");
});

/* 
  The server will listen on port PORT
*/
app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
