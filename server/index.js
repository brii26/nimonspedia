const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from Node.js Server!');
});

app.listen(port, () => {
  console.log(`Node server listening on port ${port}`);
});