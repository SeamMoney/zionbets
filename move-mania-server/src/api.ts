
import express from 'express'
const app = express()

const PORT = 3008

/* 
  This is the entry point for the server. 
*/
app.get('/', (req, res) => {
  res.send('Hello from the Move Mania server!')
});

/* 
  The server will listen on port PORT
*/
app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
})
