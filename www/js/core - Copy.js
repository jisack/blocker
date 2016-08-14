var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'RPG', { preload: preload, create: create, update: update, render: render });

function preload(){
    game.load.image('bg', 'assets/bg.svg');
    game.load.image('shadow', 'assets/shadow.svg');
    game.load.image('hero', 'assets/hero.svg');
    game.load.image('tree', 'assets/tree.svg');
    game.load.image('rock', 'assets/rock.svg');
}

function create(){
    ws = new WebSocket('ws://localhost:8000');
    client();

    game.stage.disableVisibilityChange = false;
    game.world.setBounds(0, 0, 2000, 2000);

    game.physics.startSystem(Phaser.Physics.ARCADE);

    field = game.add.tileSprite(0,0,2000,2000,'bg');
    //field.fixedToCamera = true;
    
    /*shadow = game.add.sprite(20, 20, 'shadow');
    //shadow.scale.set(0.7);
	player = game.add.sprite(40, 40, 'player');
    player.scale.set(1);
    player.anchor.setTo(0.5, 0.5);
    player.smoothed = false;

    sds = game.add.group();
    trees = game.add.group();
    trees.enableBody = true;
    //trees.physicsBodyType = Phaser.Physics.P2JS;

    for (var i = 0; i < 50; i++){
        var x = game.world.randomX;
        var y = game.world.randomY;
        var sd = sds.create(x+0, y+0, 'shadow');
        var s = Math.ceil(Math.random()*3);
        sd.scale.set(0.4+s);

        var tree = trees.create(x, y, 'tree');
        tree.scale.set(s);
        tree.body.setCircle(20);
        tree.body.immovable = true;
    }
    trees.sort();

    //player.animations.add('fly', [0,1,2,3,4,5], 10, true);
    //player.play('fly');

    //  Create our physics body - a 28px radius circle. Set the 'false' parameter below to 'true' to enable debugging
	game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.collideWorldBounds = true;
    player.body.setCircle(20);

	game.camera.follow(player);*/
}

//functions
function pointToPoint(v1,v2){
    return Math.atan2(v1.y-v2.y,v1.x-v2.x);
}
function pointToRadian(x1,y1,x2,y2){
    return Math.atan2(y1-y2,x1-x2);
}
/*function pointToAngle(x1,y1,x2,y2){
    var theta = Math.atan2(y1-y2,x1-x2)*180/Math.PI;
    if(theta<0){
        return 360+theta;
    }else{
        return theta;
    }
}*/

function update(){
    //game.physics.arcade.collide(player, trees);

    //player.body.velocity.x = 0;
    //player.body.velocity.y = 0;
    if (game.input.mousePointer.isDown){

        var rad = pointToRadian(
            player.position.x-game.camera.x,
            player.position.y-game.camera.y,
            game.input.x,
            game.input.y);
        player.rotation = rad;
        ws.send(JSON.stringify({
            status: 'move',
            id: player.id,
            rotation: rad
        }));
        //  400 is the speed it will move towards the mouse
        /*game.physics.arcade.moveToPointer(player, 200);

        player.body.rotation = pointToDegree(
            player.body.position.x-game.camera.x,
            player.body.position.y-game.camera.y,
            game.input.x,
            game.input.y);
        shadow.position.x = player.body.position.x+10;
        shadow.position.y = player.body.position.y+10;

        //  if it's overlapping the mouse, don't move any more
        if (Phaser.Rectangle.contains(player.body, game.input.x, game.input.y)){
            player.body.velocity.setTo(0, 0);
        }*/
    }else{
        //player.body.velocity.setTo(0, 0);
    }
}

function render(){

}

//Initial
var field,player,shadows,heroes,trees,rocks;
var creatures = {};
function init(){
    shadows = game.add.group();
    heroes = game.add.group();
    heroes.enableBody = true;
    trees = game.add.group();
    trees.enableBody = true;
    rocks = game.add.group();
    rocks.enableBody = true;
}

//update map
var map = {
    init: function(e){
        for(var i in e.data){
            new Block(e.data[i],e.data[i].type);
        }

        //new player
        player = new Player(e.player);
        game.camera.follow(player);
    },
    //creatures
    update: function(data){
        for(var i in data){
            var obj = creatures[data[i].id];

            switch(data[i].type){
                case 'hero':
                    if(obj){
                        obj.live(data[i]);
                    }else{
                        new Hero(data[i]);
                    }
                    break;
            }
        }
    }
};

//Classes
Hero = function(data){
    var obj = heroes.create(data.x, data.y, 'hero');
    obj.id = data.id;
    obj.radius = data.radius;
    obj.scale.set(data.scale);
    obj.anchor.setTo(0.5, 0.5);
    obj.shadow = {
        scale: data.shadow.scale,
        spread: data.shadow.spread
    };
    obj.shadowImage = shadows.create(
        data.x-data.radius,
        data.y-data.radius,
        'shadow');
    obj.shadowImage.scale.set(data.shadow.scale);

    obj.live = function(data){
        obj.rotation = data.rotation;
        obj.position.x = data.x;
        obj.position.y = data.y;
        obj.shadowImage.position.x = data.x-data.radius+obj.shadow.spread;
        obj.shadowImage.position.y = data.y-data.radius+obj.shadow.spread;
    }

    game.physics.enable(obj, Phaser.Physics.ARCADE);
    creatures[data.id] = obj;
    return obj;
}
Player = function(data){
    var obj = new Hero(data);
    return obj;
}

Block = function(data,type){
    var obj = trees.create(data.x, data.y, type);
    obj.radius = data.radius;
    obj.scale.set(data.scale);
    obj.anchor.setTo(0.5, 0.5);
    obj.shadow = {
        scale: data.shadow.scale,
        spread: data.shadow.spread
    };
    obj.shadowImage = shadows.create(
        data.x-data.radius+data.shadow.spread,
        data.y-data.radius+data.shadow.spread,
        'shadow');
    obj.shadowImage.scale.set(data.shadow.scale);
    return obj;
}