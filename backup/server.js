var fs = require('fs');
var express = require('express');
app = express();

//var bodyParser = require('body-parser');
//app.use(bodyParser.json({}));

//Enable CORS
var allowCrossDomain = function(req,res,next){
	res.header('Access-Control-Allow-Credentials','true');
	res.header('Access-Control-Allow-Origin','*')
	//res.header('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Methods','GET,POST,OPTIONS');
	/*res.header('Access-Control-Allow-Headers','X-CSRF-Token, X-Requested-With, '+
				'Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');*/
	res.header('Access-Control-Allow-Headers','X-Requested-With, '+
				'Accept, Accept-Version, Content-Length, Content-Type, Date');		
		
	res.header('X-Frame-Options','ALLOWALL');
	if('OPTIONS'==req.method){
		res.send(200);
	}else{
		next();
	}
};
app.use(allowCrossDomain);
app.use(express.static('phaser/www'));
var server = app.listen(8000);

process.on('uncaughtException', function (err) {
	console.log('Caught ' + err.stack);
});

/*var WebSocketServer = require('ws').Server;
var wss;
var port = 8888;
wss = new WebSocketServer({port: port});*/

var io = require('socket.io').listen(server, { log:false });

var users = {};

//constant
Server = {};
Server.TICK = 100;

//socket handling
function send(socket,data){
    try{
        socket.emit('message',JSON.stringify(data));
    }catch(e){
        console.log(e);
        leave(socket);
    }
}
function load(socket,data){
    var mapData = [];
    for(var i in map.obstacles){
        mapData.push(map.obstacles[i].getData());
    }
    users[data.id] = new User(socket);
    send(socket,{
        status: 'init',
        data: mapData
        //player: users[data.id].getData()
    });
}
function join(socket,data){
    /*if(users[data.id]){

    }else{*/
        users[data.id] = new Hero(socket,data);
        send(socket,{
            status: 'play',
            player: users[data.id].getData()
        });
    //}
}
function move(data){
    if(users[data.id]){
        var hero = users[data.id];
        hero.rotation = data.rotation;
        hero.dx = Math.cos(data.rotation)*hero.stat.spd;
        hero.dy = Math.sin(data.rotation)*hero.stat.spd;
        hero.move = {
            x: hero.x - hero.dx,
            y: hero.y - hero.dy
        }
    }
}
function attack(data){
    if(users[data.id]){
        var hero = users[data.id];
        hero.rotation = data.rotation;
        hero.attack();
    }
}
function text(data){
    if(users[data.id]){
        var hero = users[data.id];
        hero.text = data.text;
    }
}
function leave(socket){
   /* for(var i in users){
        if(users[i].socket==socket){
            users[i].hp = 0;
            map.creatures.splice(i,1);
            delete users[i];
            break;
        }
    }*/
    if(socket.user){
        var id = socket.user;
        if(users[id]) users[id].action.left = true;
    }
}

io.on('connection', function(socket) {
	socket.on('message', function(e) {
        var data = JSON.parse(e);
        switch(data.status){
            case 'load':
                load(socket,data);
                break;
            case 'join':
                join(socket,data);
                break;
            case 'move':
                move(data);
                break;
            case 'attack':
                attack(data);
                break;
            case 'text':
                text(data);
                break;
        }
    });
    socket.on('error',function(){
        leave(socket);
    });
    socket.on('disconnect',function(){
        leave(socket);
    });
});

//create game
function init(){
    //grid
    var rows = Math.floor(map.size/Server.grid)+1;
    for(var i=0;i<rows;i++){
        for(var j=0;j<rows;j++){
            map.grids[i+','+j] = {};
            map.sgrids[i+','+j] = {};
        }
    }

    var trees = Math.ceil(map.size*0.08);
    var rocks = Math.ceil(map.size*0.02);
    for(var i=0;i<trees;i++){
        new Tree(map.randomX(),map.randomY());
    }
    for(var i=0;i<rocks;i++){
        new Rock(map.randomX(),map.randomY());
    }
    //tower
    new Tower(map.size/4,map.size/4);
    new Tower(map.size/4*3,map.size/4);
    new Tower(map.size/4,map.size/4*3);
    new Tower(map.size/4*3,map.size/4*3);

    for(var i=0;i<5000;i++){
        new Zombie();
    }
    setInterval(update,Server.TICK);
}

//update
function getCreatures(){
    var data = [];
    for(var i in map.shots){
        map.shots[i].update();
        data.push(map.shots[i].getData());
    }
    
    //zombie count
    var zc = 0;
    for(var i in map.creatures){
        var creature = map.creatures[i];
        if(creature.type=='zombie') zc++; 
        creature.update();
        data.push(creature.getData());
    }
    if(zc<10){
        new Zombie();
    }

    for(var i in map.towers){
        map.towers[i].update();
        data.push(map.towers[i].getData());
    }
    return data;
}

function update(){
    var data = getCreatures();
    for(var i in users){
        send(users[i].socket,{
            status: 'update',
            data: data
        });
    }
}

//garbage collection
/*setInterval(function(){
    global.gc();
},1000);*/

eval(fs.readFileSync('phaser/module.js')+'');