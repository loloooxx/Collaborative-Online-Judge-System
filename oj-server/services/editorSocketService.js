var redisClient = require('../modules/redisClient');

const TIMEOUT_IN_RECONDS = 3600;

module.exports = function(io) {
  // collaboration sessions
  var collaborations = [];
  var socketIdToSessionId = [];
  var sessionPath = '/oj_server/'; // for redis

  io.on('connection', (socket) => {
    // console.log(socket);
    // var message = socket.handshake.query['message'];
    // console.log(message);
    // io.to(socket.id).emit('message', 'hahahaha from server');

    var sessionId = socket.handshake.query['sessionId'];
    socketIdToSessionId[socket.id] = sessionId;

    // add socket.id to corresponsed collaboration session participants
    // if (!(sessionId in collaborations)) {
    //   collaborations[sessionId] = {
    //     'participants': []
    //   }
    // }

    // collaborations[sessionId]['participants'].push(socket.id);

    if (sessionId in collaborations) {
      // if there are some people working on this problem
      collaborations[sessionId]['participants'].push(socket.id);
    } else {
      redisClient.get(sessionPath + sessionId, function(data) {
        if (data) {
          console.log('session terminated previously, pulling back...');
          collaborations[sessionId] = {
            'cachedInstructions': JSON.parse(data),
            'participants': []
          };
        } else {
          // if yor are the first one
          console.log('Nobody did this before, creating new session');
          collaborations[sessionId] = {
            'cachedInstructions': [],
            'participants': []
          }
        }
        collaborations[sessionId]['participants'].push(socket.id);
      });
    }

    // add change event listener (send change to other users)
    socket.on('change', delta => {
      console.log('change ' + socketIdToSessionId[socket.id] + ' ' + delta);
      // let sessionId = socketIdToSessionId[socket.id];
      // if (sessionId in collaborations) {
      //     let participants = collaborations[sessionId]['participants'];
      //     for (let i = 0; i < participants.length; i++) {
      //       if (socket.id != participants[i]) {
      //         io.to(participants[i]).emit('change', delta);
      //       }
      //     }
      // } else {
      //     console.log('WARNING!!!!!');
      // }
      let sessionId = socketIdToSessionId[socket.id];
      if (sessionId in collaborations) {
        collaborations[sessionId]['cachedInstructions'].push(
            ['change', delta, Date.now()]
        );
      }
      forwardEvent(socket.id, 'change', delta);
    });

    // socket cursorMove update
    socket.on('cursorMove', cursor => {
      console.log('cursorMove ' + socketIdToSessionId[socket.id] + ' ' + cursor);
      cursor = JSON.parse(cursor);
      cursor['socketId'] = socket.id;
      // let sessionId = socketIdToSessionId[socket.id];
      // if (sessionId in collaborations) {
      //     let participants = collaborations[sessionId]['participants'];
      //     for (let i = 0; i < participants.length; i++) {
      //       if (socket.id != participants[i]) {
      //         io.to(participants[i]).emit('cursorMove', JSON.stringify(cursor));
      //       }
      //     }
      // } else {
      //     console.log('WARNING!!!!!');
      // }
      forwardEvent(socket.id, 'cursorMove', JSON.stringify(cursor));
    });

    socket.on('restoreBuffer', () => {
      var sessionId = socketIdToSessionId[socket.id];
      console.log('restore buffer to session: ' + sessionId);

      if (sessionId in collaborations) {
        let cachedInstructions = collaborations[sessionId]['cachedInstructions'];
        for (let i = 0; i < cachedInstructions.length; i++) {
          socket.emit(cachedInstructions[i][0], cachedInstructions[i][1]);
        }
      } else {
        console.log('WARNING');
      }
    });

    socket.on('disconnect', () => {
      var sessionId = socketIdToSessionId[socket.id];
      console.log('socket ' + socket.id + ' disconnected from session: ' + sessionId);
      var foundAndRemove = false;
      if (sessionId in collaborations) {
        var participants = collaborations[sessionId]['participants'];
        var index = participants.indexOf(socket.id);
        if (index >= 0) {
          participants.splice(index , 1);
          foundAndRemove = true;

          if (participants.length === 0) {
            console.log('last participants left, saving to Redis');

            let key = sessionPath + sessionId;
            let value = JSON.stringify(collaborations[sessionId]['cachedInstructions']);

            redisClient.set(key, value, redisClient.redisPrint);
            redisClient.expire(key, TIMEOUT_IN_RECONDS);
            delete collaborations[sessionId];
          }
        }
      }
      if (!foundAndRemove) {
        console.log('WARNING!');
      }
    });

  });

  // refactor
  var forwardEvent = function(socketId, eventName, dataString) {
      let sessionId = socketIdToSessionId[socketId];
      if (sessionId in collaborations) {
          let participants = collaborations[sessionId]['participants'];
          for (let i = 0; i < participants.length; i++) {
            if (socketId != participants[i]) {
              io.to(participants[i]).emit(eventName, dataString);
            }
          }
      } else {
          console.log('WARNING!!!!!');
      }
  }
}