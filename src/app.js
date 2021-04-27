const express = require('express');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
require('./db/mongoose');

// Express configuration
const app = express();

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;