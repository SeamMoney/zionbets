
import express from 'express'
import { createUser, deleteUser, getUser, getUsers, updateUser } from './database';
var cors = require('cors')
const app = express()
app.use(express.json())
app.use(cors())

const PORT = 3008

/* 
  This is the entry point for the server. 
*/
app.get('/', (req, res) => {
  res.send('Hello from the Move Mania server!')
});

app.get('/users', async (req, res) => {
  const users = await getUsers();
  res.send(users);
});

app.get('/users/:email', async (req, res) => {
  const email = req.params.email;
  const user = await getUser(email);
  if (user) {
    res.send(user);
  } else {
    res.status(404).send('User not found');
  }
});

app.post('/users', async (req, res) => {
  const user = req.body
  try {
    await createUser(user);
  } catch (e) {
    res.status(400).send('User already exists');
    return;
  }
  res.send('User created');
});

app.put('/users/:email', async (req, res) => {
  const email = req.params.email;
  const user = req.body
  await updateUser(email, user);
  res.send('User updated'); 
});

app.delete('/users/:email', async (req, res) => {
    const email = req.params.email;
    await deleteUser(email);
    res.send('User deleted');
});

/* 
  The server will listen on port PORT
*/
app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
})
