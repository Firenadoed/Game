const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const URL =  "mongodb+srv://admin:root@forgame.do9qyph.mongodb.net/Users?retryWrites=true&w=majority&appName=ForGame";

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });



const PORT = process.env.PORT || 5000;

var currentsocket;

app.use(express.static('public'));


// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var multiplayerphrase = [];
var findinguser = [];

io.on("connection", (socket) => {
  console.log(socket.id);
  currentsocket = socket.id;

  Message.find().sort({ timestamp: -1 }).limit(10)
  .then(messages => {
      socket.emit('load messages', messages.reverse());
  })
  .catch(err => {
      console.error(err);
  });



socket.on('new message', (data) => {
  const message = new Message(data);
  message.save()
  .then(() => {
      io.emit('new message', data);
  })
  .catch(err => {
      console.error(err);
  });
});

socket.on('randomphrase', (data) => {
  multiplayerphrase.push(data);

  if (multiplayerphrase.length === 2) {
      const selectedPhrase = multiplayerphrase[0]; // Always pick the first phrase

      socket.emit('selectedphrase', selectedPhrase);

      multiplayerphrase = [];
  }
});




socket.on("addmatch", (data) =>{
  findinguser.push({ socketId: socket.id, data })


})
socket.on('dcmatch', (data) => {
  findinguser = findinguser.filter(user => user.socketId !== socket.id);


  socket.emit('removed', 'You have been removed from the findinguser array.');
});



socket.on("winner", async (data) => {
  try {
    const winnername = data.loggeduser;
    const losername = data.enemyname;


    const winner = await User.findOne({ username: winnername });
    const loser = await User.findOne({ username: losername });

    if (!winner || !loser) {
      throw new Error('Winner or loser not found in the database');
    }

 
    winner.MMR += 25;
    winner.bestWS += 1;
    if (loser.MMR > 0) { 
      loser.MMR -= 25; 
    }
    loser.bestWS  = 0;

   
    await winner.save();
    await loser.save();

   
    io.to(loser.socketId).emit("loser", { message: "You lost!" });
  } catch (error) {
    console.error('Error handling winner event:', error);
   
  }
});








  socket.on("disconnect", async () => {
    try {
      const user = await User.findOne({ socketId: socket.id });
      if (user) {
        user.online = false;
        user.socketId = "0"
        await user.save();
        console.log(`User ${user.username} disconnected`);
        findinguser = findinguser.filter(user => user.socketId !== socket.id ||user.socketId == "0"  );
      }
    } catch (error) {
      console.error('Error updating user status on disconnect:', error);
    }
    
  });


});



function findMatches() {
  while (findinguser.length >= 2) {
    const user1 = findinguser.shift();
    const user2 = findinguser.shift();
  
    io.to(user1.socketId).emit('match found', { opponentname: user2.data, opponentSocketId: user2.socketId });
    io.to(user2.socketId).emit('match found', { opponentname: user1.data, opponentSocketId: user1.socketId });
  }
}

setInterval(findMatches, 5000);










mongoose.connect(URL)
.then(()=>{
    console.log('mongodb connected');
})
.catch (()=>{

    console.log("failed to connect")
})

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  playerId: Number,
  socketId: {
    type: String,
    default: '0'
  },
  online: {
    type: Boolean,
    default: false
  },
  bestTime: {
    type: String,
    default: "null"
  },
  bestWS: {
    type: Number,
    default: 0
  },
  MMR:{
    type: Number,
    default: 0
  }
 
});

const User = mongoose.model('User', UserSchema);


app.post('/register', async (req, res) => {
  try {
    const { username,password } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
        
        return res.status(400).json({ message: 'Username already exists' });
      }

    const playerId = crypto.randomInt(10000, 99999); 
    const newUser = new User({ username, password,playerId });
    await newUser.save();
    res.status(201).json(newUser);

  } catch (err) {

    console.error(err);
    res.status(500).send('Server Error');
    
  }
});


app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
        console.log(username);
      
      const user = await User.findOne({ username, password});
        
      if (user) {
        user.socketId = currentsocket;
        user.online = true;
        await user.save();
        res.status(200).json({ message: 'Login successful' });
     
      } else {
        
        res.status(401).json({ message: 'Invalid username or password' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });

 


  app.post('/sendtime', async (req, res) => {
  
  var receivedtime = req.body.formattedTime;
  var username = req.body.loggeduser;

 
  await saveTimeToDatabase(receivedtime, username);
  
    res.send('Received the variable: ' + receivedtime);
  });
  



async function saveTimeToDatabase(receivedTime, username) {
  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      throw new Error('User not found');
    }

    // Update the user's best time
    user.bestTime = receivedTime;

    // Save the updated user data
    await user.save();

    console.log(`Received time '${receivedTime}' saved for user '${username}'`);
  } catch (error) {
    console.error('Error saving received time:', error);
    throw error;
  }
}



app.get('/leaderboardinfo', async (req, res) => {
  try {
    
    const users = await User.find({}, 'username bestTime bestWS MMR');

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});




const MessageSchema = new mongoose.Schema({
  user: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);



const MESSAGE_RETENTION_TIME = 60 * 60 * 1000; 





async function deleteOldMessages() {
  try {
    const oneHourAgo = new Date(Date.now() - MESSAGE_RETENTION_TIME);
    await Message.deleteMany({ timestamp: { $lt: oneHourAgo } });
    console.log('Deleted messages older than an hour.');
  } catch (error) {
    console.error('Error deleting old messages:', error);
  }
}



setInterval(deleteOldMessages, 5 * 60 * 1000);



deleteOldMessages();










  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});