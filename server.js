var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

server.listen(8013);

// routing for clients
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

// routing for overviewpage
app.get('/server.html', function (req, res) {
    res.sendfile(__dirname + '/server.html');
});

app.get('/app.css', function (req, res) {
    res.sendfile(__dirname + '/app.css');
});

// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) {

    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
        io.sockets.emit('updatechat', socket.username, data);
    });

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username){
        // we store the username in the socket session for this client
        socket.username = username;

        // add the client's username to the global list
        usernames[username] = '';

        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'you have connected');

        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');

        // update the list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
    });

    // when the client emits 'poker', this listens and executes
    socket.on('poker', function (pokervalue) {
        // we store the pokervalue in the socket session for this client
        socket.pokervalue = pokervalue;

        // add the client's value to the global list
        usernames[socket.username] = pokervalue;

        // echo to client they've made a choice
        socket.emit('updatechat', 'SERVER', 'you have made the following choice: ' + pokervalue);

        // update userlist, this giver the server client the poker value in advance
        io.sockets.emit('updateusers', usernames);
    });

    // when the "server" client emits 'requestuserlist' send the userlist back
    socket.on('requestuserlist', function () {
        // send the updateusers commando to the server client
        socket.emit('updateusers', usernames);
    });

    // when the "server" client emits 'reset', reset all poker choices to empty
    socket.on('reset', function () {
        //Just empty the pokervalues, not the key usernames
        for (var prop in usernames) {
            if(usernames.hasOwnProperty(prop)){
                usernames[prop] = '';
            }
        }

        //Emit the reset choices command to all users
        io.sockets.emit('resetchoices');

        // Let the users know the has been made a reset
        socket.broadcast.emit('updatechat', 'SERVER', 'Poker choices reset for a new poker');

        io.sockets.emit('updateusers', usernames);
    });

    // when the "server" client emits 'releaase', Update the log with chosen poker values
    socket.on('reset', function () {
        //Just empty the pokervalues, not the key usernames
        for (var prop in usernames) {
            if(usernames.hasOwnProperty(prop)){
                usernames[prop] = '';
            }
        }

        //Emit the reset choices command to all users
        io.sockets.emit('resetchoices');

        // Let the users know the has been made a reset
        socket.broadcast.emit('updatechat', 'SERVER', 'Poker choices reset for a new poker');

        io.sockets.emit('updateusers', usernames);
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function(){
        if(socket.username) {
            // remove the username from global usernames list
            delete usernames[socket.username];

            // update list of users in chat, client-side
            io.sockets.emit('updateusers', usernames);

            // echo globally that this client has left
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        }
    });

});