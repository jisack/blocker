var fs = require('fs');
var express = require('express');
app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json({}));

app.use(express.static('phaser/www'));
app.listen(8000);

process.on('uncaughtException', function (err) {
	console.log('Caught ' + err.stack);
});

var WebSocketServer = require('ws').Server;
var wss;
var port = 8888;
wss = new WebSocketServer({port: port});
var users = {};

//constant
Server = {};
Server.TICK = 100;

//websocket handling
function send(ws,data){
    try{
        ws.send(JSON.stringify(data));
    }catch(e){
        console.log(e);
        leave(ws);
    }
}
function join(ws,data){
    if(users[data.id]){

    }else{
        users[data.id] = new Hero(ws,data);
    }
    var mapData = [];
    for(var i in map.obstacles){
        mapData.push(map.obstacles[i].getData());
    }
    send(ws,{
        status: 'init',
        data: mapData,
        player: users[data.id].getData()
    });
}
function move(data){
    var hero = users[data.id];
    hero.rotation = data.rotation;
    hero.move = {
        x: hero.x - Math.cos(data.rotation)*hero.stat.spd,
        y: hero.y - Math.sin(data.rotation)*hero.stat.spd
    }
}
function attack(data){
    var hero = users[data.id];
    hero.rotation = data.rotation;
    hero.attack();
}
function leave(ws){
   /* for(var i in users){
        if(users[i].ws==ws){
            users[i].hp = 0;
            map.creatures.splice(i,1);
            delete users[i];
            break;
        }
    }*/
    var id = ws.id;
    users[id].action.left = true;
}

wss.on('connection', function(ws) {
	ws.on('message', function(e) {
        var data = JSON.parse(e);
        switch(data.status){
            case 'join':
                join(ws,data);
                break;
            case 'move':
                move(data);
                break;
            case 'attack':
                attack(data);
                break;
        }
    });
    ws.on('error',function(){
        leave(ws);
    });
    ws.on('close',function(){
        leave(ws);
    });
});

//create game
function init(){
    for(var i=0;i<100;i++){
        new Tree(map.randomX(),map.randomY());
    }
    for(var i=0;i<40;i++){
        new Rock(map.randomX(),map.randomY());
    }
    for(var i=0;i<6;i++){
        new Zombie();
    }
}

//update
function getCreatures(){
    var data = [];
    for(var i in map.creatures){
        map.creatures[i].update();
        data.push(map.creatures[i].getData());
    }
    return data;
}
function update(){
    var data = getCreatures();
    for(var i in users){
        send(users[i].ws,{
            status: 'update',
            data: data
        });
    }
}
setInterval(update,Server.TICK);

//garbage collection
/*setInterval(function(){
    global.gc();
},30000);*/

eval(fs.readFileSync('phaser/module.js')+'');