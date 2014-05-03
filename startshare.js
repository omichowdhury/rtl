var connect = require('./node_modules/connect'),
    sharejs = require('./node_modules/share').server;

var server = connect(
    connect.logger(),
    connect.static(__dirname + '/public')
);
var options = {db:{type:'none'}}; // See docs for options. {type: 'redis'} to enable persistance.

// Attach the sharejs REST and Socket.io interfaces to the server
sharejs.attach(server, options);

server.listen(8000, function () {
    console.log('Server running at http://127.0.0.1:8000/');
});

