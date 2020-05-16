require('dotenv').config();
const container = require('./config/connect.js');
var socketIO = require('socket.io');
var http = require('http');
var express = require('express');
var app = express();
var server  = http.createServer(app);
var io = socketIO(server);
var users = {};

io.on('connect',async function (socket){

    /**
     * connected new Device or existing device
     */
    socket.on('user',function (data){
        if(!users[data.deviceSerialNumber])
        users[data.deviceSerialNumber] = [this.id];
        else
        users[data.deviceSerialNumber].push(this.id);
        console.log(`User connected !! socketId : ${this.id}, deviceSerialNumber : ${data.deviceSerialNumber} `);
    
    });

    /**
     * Disconnected who has loged out
     */
    socket.on('disconnect',function (data){
       
        var index = null ;
        for(var i in users){
           if((index=users[i].findIndex(data => data == this.id)) != -1){
            console.log(`User disconnected !! socketId : ${this.id}, deviceSerialNumber : ${i} `);
            if(users[i].length != 1) 
            users[i].splice(index,1);
            else
            delete users[i];
            break;
            }
        }
     });
        
     /**
      * Sending DeviceData (DeviceSerialNumber, Latitude, Longitude, Speed) to UI
      * 
      * Based on the request 
      */
       var userArray = [];
       await setInterval(async ()=>{
        if((userArray=Object.keys(users)).length != 0){ 
          await userArray.map(async i => {
               await container.items.query({
                query: `SELECT * from items dsn WHERE dsn.deviceSerialNumber = @deviceSerialNumber`,
                parameters: [{ name: "@deviceSerialNumber", value: i }]
              }).fetchAll().then(async data => { 
                var { deviceSerialNumber , latitude , longitude, id} = data.resources[0];
                   await users[i].map(async socketid => {
                       await io.sockets.to(socketid).emit('chat',{ deviceSerialNumber , latitude ,
                         longitude,id,deliveryDateTime:new Date().toISOString()});
                    });
                }).catch(err => console.error(err));
            });
         }
        },5000);
     });

// let port = process.env.PORT || 3055;
server.listen(process.env.PORT,console.log.bind(console,'Server is up on port :',process.env.PORT));
