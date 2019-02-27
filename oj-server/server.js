const express = require('express');
const app = express();

const mongoose = require('mongoose');
mongoose.connect('mongodb://Wei:show9999@ds143953.mlab.com:43953/oj');
const restRouter = require('./routes/rest');
const indexRouter = require('./routes/index');

const path = require('path');
app.use(express.static(path.join(__dirname, '../public/')));
app.use('/', indexRouter);

app.use('/api/v1', restRouter);

app.use(function(req, res) {
  res.sendFile('index.html', {root: path.join(__dirname, '../public')});
});

// app.listen(3000, function() {
//   console.log('Example app is running on port 3000!');
// });

var http = require('http');
var socketIO = require('socket.io');
var io = socketIO();

var editorSocketService = require('./services/editorSocketService')(io);

//create http server
var server = http.createServer(app);
io.attach(server);
server.listen(3000);
server.on('error', onError);
server.on('listening', onListening);

function onError() {
  throw error;
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}