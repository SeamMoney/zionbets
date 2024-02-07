
import express from 'express'
import { createUser, deleteUser, getUser, getUsers, updateUser } from './database';
const app = express()
app.use(express.json())

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

app.get('/users/:username', async (req, res) => {
  const username = req.params.username;
  const user = await getUser(username);
  if (user) {
    res.send(user);
  } else {
    res.status(404).send('User not found');
  }
});

app.post('/users', async (req, res) => {
  const user = req.body
  await createUser(user);
  res.send('User created');
});

app.put('/users/:username', async (req, res) => {
  const username = req.params.username;
  const user = req.body
  await updateUser(username, user);
  res.send('User updated'); 
});

app.delete('/users/:username', async (req, res) => {
    const username = req.params.username;
    await deleteUser(username);
    res.send('User deleted');
});

/* 
  The server will listen on port PORT
*/
app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
})
