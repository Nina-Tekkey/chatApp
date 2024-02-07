var socketio = io.connect();
var socketid;
var username;
var ownerStatus;
var currentRoomKey;
var typing =false;

//check if name change
document.getElementById("signin").addEventListener(
  "click",
  function (event) {
    changeName();
  },
  false
);
//check if a new room is created
document.getElementById("newRoom").addEventListener(
  "click",
  function (event) {
    pass=null;
    sendMessage(pass);
  },
  false
);
//check if new room w pass is created
document.getElementById("passRoom").addEventListener(
    "click",
    function (event) {
        pass=document.getElementById("roomPasscode").value;
      sendMessage(pass);
    },
    false
  );
  //leave Room button
$(document).ready(function () {
  $("#TypeAndLeave").on("click", "#formBtn", function () {
    
    socketio.emit("leaveRoomServer", {"roomKeyIn": currentRoomKey});
    backToRooms();
  });
});
//send message button
$(document).ready(function () {
    $("#TypeAndLeave").on("click", "#sendMsg", function () {
        
        var pmUser =document.getElementById("pmusein").value;
        var msg = document.getElementById("messIn").value;
        typing=false;
        if(document.getElementById("typingInd")!=null) {
            document.getElementById("typingInd").remove();
        }
        if(pmUser!==""){
            socketio.emit("sendPMServer", {"roomKeyIn": currentRoomKey, "message":msg, "PMUser": pmUser});
        }else{
        
        socketio.emit("sendMsgServer", {"roomKeyIn": currentRoomKey, "message":msg});
        }
    });
  });
//kick button
  $(document).ready(function () {
    $("#TypeAndLeave").on("click", "#kick", function () {
        var kickuse = document.getElementById("useIn").value;
      socketio.emit("kickUserServer", {"roomKeyIn": currentRoomKey, "userToKick":kickuse});

    });
  });
//ban button
  $(document).ready(function () {
    $("#TypeAndLeave").on("click", "#ban", function () {
        var kickuse = document.getElementById("useIn").value;
      socketio.emit("banUserServer", {"roomKeyIn": currentRoomKey, "userToKick":kickuse});

    });
  });

  
//makes new room element
socketio.on("message_to_client", function (data) {
  //Append an HR thematic break and the escaped HTML of the new message
  document.getElementById("chatlog").appendChild(document.createElement("hr"));
  //  document.getElementById("chatlog").appendChild(document.createTextNode(data['message']));
  const element = document.getElementById("chatlog");
  const deNote = document.createElement("p");
  let delNode = document.createTextNode(data["message"]);
  deNote.appendChild(delNode);
  element.appendChild(deNote);
});
//parses message the sends to socket
function sendMessage(pass) {
  var msg = document.getElementById("message_input").value;
  socketio.emit("message_to_server", { message: msg, password:pass });
}


socketio.on("sendUserBack", function (data) {
  //Append an HR thematic break and the escaped HTML of the new message

  username = data["username"];
  document.getElementById("usernamePlace").innerHTML = data["username"];
  //  document.getElementById("chatlog").appendChild(document.createTextNode(data['message']));
});

//calls socket to change username
function changeName() {
  var userChange = document.getElementById("olduser").value;
  socketio.emit("userToServer", { newUse: userChange });
}
//called to change username on client side
socketio.on("newUseClient", function (data) {
  //Append an HR thematic break and the escaped HTML of the new message

  username = data["newUse"];
  document.getElementById("usernamePlace").innerHTML = data["newUse"];
  //  document.getElementById("chatlog").appendChild(document.createTextNode(data['message']));
});
//click on room allows entry
$(document).ready(function () {
  $("#chatlog").on("click", "p", function () {
    var roomkey = $(this).text()
    roomkey = roomkey.substring(0, roomkey.indexOf(".") );
    currentRoomKey=roomkey;
    socketio.emit("enterRoomToServer", { roomKeyIn: roomkey }); 

    
  });
});
//call to client from server after entering room
socketio.on("RoomEnterClient", function (data) {
    ownerStatus=data["owner"];
    roomName=data["roomName"];
   
    enterRoom(roomName, ownerStatus);
  });


 //updates room users on leaving 
  socketio.on("userInRoomClient", function (data) {
        document.getElementById("usersInRoom").innerHTML="";
        var ol = document.createElement("ul");
    for(i in data["user"]){
        let li = document.createElement("li");
        li.innerHTML= data["user"][i];
        ol.appendChild(li);
    }
    document.getElementById("usersInRoom").appendChild(ol);
  });
  

//this sets up the room structure and chat
function enterRoom(roomName) {
  $("#chatlog").hide();
  $("h6").hide();
//Add message sending and leave room
//message sending input and buttons
  TypeAndLeave = document.getElementById("TypeAndLeave");
  let tit = document.createTextNode("Message:  ");
  TypeAndLeave.appendChild(tit);
  var input = document.createElement("input");
  input.type = "text";
  tit.id = "messTitle";
  input.setAttribute("id", "messIn");
  TypeAndLeave.appendChild(input); // put it in
  document.getElementById("div1").innerHTML=roomName;

  
 

 let pmtit = document.createTextNode("PM to Username:  ");
  TypeAndLeave.appendChild(pmtit);
  var pmuse = document.createElement("input");
  pmuse.type = "text";
  pmtit.id = "PMTit";
  pmuse.setAttribute("id", "pmusein");
  TypeAndLeave.appendChild(pmuse); // put it in
//   let pm = document.createElement("button");
//   pm.innerHTML = "Send PM";
//   pm.type = "button";
//   pm.id = "sendPM";
//   TypeAndLeave.appendChild(pm);
let s = document.createElement("button");
s.innerHTML = "Send";
s.type = "button";
s.id = "sendMsg";

TypeAndLeave.appendChild(s);


  var brk = document.createElement("br");
  TypeAndLeave.appendChild(brk);
  let btn = document.createElement("button");
  btn.innerHTML = "Leave Room";
  btn.type = "submit";
  btn.id = "formBtn";
  TypeAndLeave.appendChild(btn);
  //gives options to kick and ban
  if(ownerStatus){
    var br = document.createElement("br");
    TypeAndLeave.appendChild(br);
  let bk = document.createTextNode("\nUser to Ban or Kick:  ");
  TypeAndLeave.appendChild(bk);
  var n = document.createElement("input");
  n.type = "text";
  bk.id = "useTit";
  n.setAttribute("id", "useIn");
  TypeAndLeave.appendChild(n); // put it in
  let b = document.createElement("button");
  b.innerHTML = "Kick";
  b.type = "button";
  b.id = "kick";
  TypeAndLeave.appendChild(b);
  let a = document.createElement("button");
  a.innerHTML = "Ban";
  a.type = "button";
  a.id = "ban";
  TypeAndLeave.appendChild(a);

  }


 
}
//fuction called to go back to lobby
function backToRooms(){
    $("#chatlog").show();
    $("h6").show();
    currentRoomKey=null;
    ownerStatus=null;
    TypeAndLeave = document.getElementById("TypeAndLeave");
    TypeAndLeave.innerHTML="";
    RoomMessages = document.getElementById("RoomMessages");
    RoomMessages.innerHTML="";
    document.getElementById("usersInRoom").innerHTML="";
    
    document.getElementById("div1").innerHTML="CHAT ROOM LOBBY";
}
//displays message in room
socketio.on("sendMessageClient", function (data) {
    //Append an HR thematic break and the escaped HTML of the new message
    
    const element = document.getElementById("RoomMessages");
    const deNote = document.createElement("p");
    
    deNote.style.color=data["color"];
    let delNode = document.createTextNode(data["user"]+": "+data["message"]);
    deNote.appendChild(delNode);
    element.appendChild(deNote);
  });





//prompts for pass and checks in socket
  socketio.on("askForPass", function (data) {
    let pass = prompt("Please enter your the password");
    socketio.emit("enterRoomToServerPassword", { roomKeyIn: data["roomKeyIn"], passGuess: pass }); 
    
  });
  //wrong pass alert
  socketio.on("wrongPass", function (data) {
   alert("Wrong Password");
    
  });

//kick alert
  socketio.on("beingKickedClient", function (data) {
    alert("KICKED");
    socketio.emit("leaveRoomServer", {"roomKeyIn": data["roomKeyIn"]});
    backToRooms();
  });
  //ban alerts
  socketio.on("beingBannedClient", function (data) {
    alert("BANNED");
    socketio.emit("leaveRoomServer", {"roomKeyIn": data["roomKeyIn"]});
    backToRooms();
  });

  socketio.on("banRemind", function (data) {
    alert("You are BANNED from Room: "+data["roomName"]);
  
  });
//private message display
  socketio.on("sendPMClient", function (data) {
    //Append an HR thematic break and the escaped HTML of the new message
    
    const element = document.getElementById("RoomMessages");
    const deNote = document.createElement("p");
    let delNode = document.createTextNode("(PM)"+data["user"]+": "+data["message"]);
    deNote.appendChild(delNode);
    element.appendChild(deNote);
  });



//STUFF FOR TYPING INDICATOR

//if text in input show typing
  $(document).ready(function(){
    $("#TypeAndLeave").on("input", "#messIn", function(){
       
        if(!typing){
        typing=true;
        socketio.emit("typingIndc", {"roomKeyIn": currentRoomKey});
        }
    });
});
//inerval to get rid of indicator
setInterval(function () {
    typing=false;
    if(document.getElementById("typingInd")!=null) {
        document.getElementById("typingInd").remove();
    }
}, 10000);
//displays the typing indicator
socketio.on("typingIncClient", function (data) {
    const element = document.getElementById("RoomMessages");
    const deNote = document.createElement("p");
    deNote.id="typingInd";
    let delNode = document.createTextNode(data["user"]+": "+data["message"]);
    deNote.appendChild(delNode);
    element.appendChild(deNote);
  });



