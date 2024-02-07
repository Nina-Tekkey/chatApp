var Rooms = {};
var userIdName={};
var colorwheel={
    0: "#FF0000",
    1: "#0004ff",
    2: "#b34a1d",
    3: "#07632a",
    4:"#460763"
};
const len = 5;
var curcolor=0;
var userIdToColor={};
var nameEnd = 0;
var roomKey=0;
// Require the packages we will use:
var http = require('http'),
	url = require('url'),
	path = require('path'),
	mime = require('mime'),
	fs = require('fs');


// Make a simple fileserver for all of our static content.
// Everything underneath <STATIC DIRECTORY NAME> will be served.
var server = http.createServer(function(req, resp){
	var filename = path.join(__dirname, "chatFiles", url.parse(req.url).pathname);
	(fs.exists || path.exists)(filename, function(exists){
		if (exists) {
			fs.readFile(filename, function(err, data){
				if (err) {
					// File exists but is not readable (permissions issue?)
					resp.writeHead(500, {
						"Content-Type": "text/plain"
					});
					resp.write("Internal server error: could not read file");
					resp.end();
					return;
				}
				
				// File exists and is readable
				var mimetype = mime.getType(filename);
				resp.writeHead(200, {
					"Content-Type": mimetype
				});
				resp.write(data);
				resp.end();
				return;
			});
		}else{
			// File does not exist
			resp.writeHead(404, {
				"Content-Type": "text/plain"
			});
			resp.write("Requested file not found: "+filename);
			resp.end();
			return;
		}
	});
});
server.listen(3456);

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(http, {
    wsEngine: 'ws'
});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
io.sockets.on("connection", function (socket) {
    
    // This callback runs when a new Socket.IO connection is established.
    //init user
        var id = socket.id;
        var name = "";
        if(id in userIdName){
            name = userIdName[id];
        }else{
            name = "user"+nameEnd;
            nameEnd+=1;
            userIdName[id]=name;
            userIdToColor[id]= colorwheel[curcolor%len];
            curcolor++;

        }
        io.to(id).emit("sendUserBack", { "username":  name, "id": id  });
        for(room in Rooms){
            roomName = Rooms[room]["roomName"];
            io.to(id).emit("message_to_client", { "message":  roomName }) // broadcast the message to other users

        }
      
        //room maker
    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.
        
        roomName = roomKey+". "+data["message"]
        Rooms[roomKey]={"creator": socket.id,
        "roomName": roomName,"password":data["password"], "bannedUsers":[], "currentUsers": []};
        roomKey+=1;
        
        io.sockets.emit("message_to_client", { "message":  roomName, "user": userIdName[socket.id]  }) // broadcast the message to other users
    });

    //username change
    socket.on('userToServer', function (data) {
        var id = socket.id;
        var newUse = data["newUse"];
        userIdName[id] = newUse;
        
        io.to(id).emit("newUseClient", { "newUse":  data["newUse"]  });
    });
//enter room, check if banned or need pass
    socket.on('enterRoomToServer', function (data) {
       k=data["roomKeyIn"];
       var ban = false;
       for(i in Rooms[k]["bannedUsers"]){
        if(Rooms[k]["bannedUsers"][i]===socket.id){
            ban=true;
           }
       }
        if(ban){
        io.to(socket.id).emit("banRemind", {"roomName": Rooms[k]["roomName"] });

       }else{
       if(Rooms[k]["password"]!=null){
        io.to(socket.id).emit("askForPass", { "roomKeyIn": k });
       }else{
       socket.join(data["roomKeyIn"]);
       var  key =data["roomKeyIn"]; 
        var cre =Rooms[key]["creator"];
       if(cre===socket.id){
            owner=true;
       }else{
        owner=false;
       }
    
       Rooms[key]["currentUsers"].push(socket.id);
       var n = [];
       for(i in Rooms[key]["currentUsers"]){
        n.push(userIdName[Rooms[key]["currentUsers"][i]]);
        
       }
       

        io.to(socket.id).emit("RoomEnterClient", { "owner": owner, "roomName": Rooms[key]["roomName"], "color": userIdToColor[socket.id] });
       io.to(data["roomKeyIn"]).emit("userInRoomClient", { "user": n  }) // broadcast the message to other users
        }
    }
    });
//leave the room remove from user list
    socket.on('leaveRoomServer', function (data) {
        k=data["roomKeyIn"];
        //const index = Rooms[k]["currentUsers"].findIndex(userIdName[socket.id]);
  
        var n = [];
        for(i in Rooms[data["roomKeyIn"]]["currentUsers"]){
            if(Rooms[data["roomKeyIn"]]["currentUsers"][i]===socket.id){
                Rooms[data["roomKeyIn"]]["currentUsers"].splice(i,1);
            }else{
            n.push(userIdName[Rooms[data["roomKeyIn"]]["currentUsers"][i]]);
            }
        }
        socket.leave(data["roomKeyIn"]);
        io.to(data["roomKeyIn"]).emit("userInRoomClient", { "user": n  }) // broadcast the message to other users
      
     });
//volley message
     socket.on('sendMsgServer', function (data) {
        // This callback runs when the server receives a new message from the client.
       

        io.to(data["roomKeyIn"]).emit("sendMessageClient", { "message":  data["message"], "user": userIdName[socket.id], "color":userIdToColor[socket.id]  }) // broadcast the message to other users
    });
//send private message and check to see they are in the room
    socket.on('sendPMServer', function (data) {
       var k=data["roomKeyIn"];
        id=Object.keys(userIdName).find(key => userIdName[key] === data["PMUser"]);
        var inRoom=false;
        for(i in Rooms[k]["currentUsers"]){
            if(Rooms[k]["currentUsers"][i]===id){
                inRoom=true;
                
               }
           }
            if(inRoom){
            io.to(socket.id).emit("sendPMClient", { "message":  data["message"], "user": userIdName[socket.id]  }) // broadcast the message to other users

            io.to(id).emit("sendPMClient", { "message":  data["message"], "user": userIdName[socket.id]  }) // broadcast the message to other users
            }
    });
    //get rid of user on disconnect
    socket.on("disconnect", (reason) => {
        var n = [];
        for(room in Rooms){
            for(i in Rooms[room]["currentUsers"]){
                if(Rooms[room]["currentUsers"][i]===socket.id){
                    Rooms[room]["currentUsers"].splice(i,1);
                }
            }
           
        }
      });




//enter room with a password
      socket.on('enterRoomToServerPassword', function (data) {
        k=data["roomKeyIn"];
        if(Rooms[k]["password"]!=data["passGuess"]){
            io.to(socket.id).emit("wrongPass", { "roomKeyIn": k });
           }else{

        socket.join(data["roomKeyIn"]);
        var  key =data["roomKeyIn"]; 
         var cre =Rooms[key]["creator"];
        if(cre===socket.id){
             owner=true;
        }else{
         owner=false;
        }
   
        
        Rooms[key]["currentUsers"].push(socket.id);
        var n = [];
        for(i in Rooms[key]["currentUsers"]){
         n.push(userIdName[Rooms[key]["currentUsers"][i]]);
         
        }
 
         io.to(socket.id).emit("RoomEnterClient", { "owner": owner, "roomName": Rooms[key]["roomName"] });
        io.to(data["roomKeyIn"]).emit("userInRoomClient", { "user": n  }); // broadcast the message to other users
         }
         
     });

//kick user
     socket.on('kickUserServer', function (data) {
        k=data["roomKeyIn"];
        id=Object.keys(userIdName).find(key => userIdName[key] === data["userToKick"]);
        

        io.to(id).emit("beingKickedClient", { "roomKeyIn": k }); // broadcast the message to other users

     });
//put user on ban list
     socket.on('banUserServer', function (data) {
        k=data["roomKeyIn"];
        id=Object.keys(userIdName).find(key => userIdName[key] === data["userToKick"]);
        Rooms[k]["bannedUsers"].push(id);

        io.to(id).emit("beingBannedClient", { "roomKeyIn": k }); // broadcast the message to other users

     });
//typing indicaror
     socket.on('typingIndc', function (data) {
        k=data["roomKeyIn"];
        var message = " is typing....."
        io.to(data["roomKeyIn"]).emit("typingIncClient", { "message":  message, "user": userIdName[socket.id]  }) // broadcast the message to other users

     });


  
});

