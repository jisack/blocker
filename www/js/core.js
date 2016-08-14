var game = new Phaser.Game('100%', '100%', Phaser.CANVAS, 'RPG', { preload: preload, create: create, update: update, render: render});

function preload(){
    game.load.image('bg', 'assets/bg.svg');
    game.load.image('shadow', 'assets/shadow.svg');
    game.load.image('rock', 'assets/rock.svg');
    game.load.image('tree', 'assets/tree.svg');
    
    game.load.spritesheet('zombie', 'assets/zombie.svg',46,46);
    game.load.image('hands', 'assets/weapons/hands.svg');
    game.load.spritesheet('hero', 'assets/hero.svg',46,46);
    game.load.spritesheet('sword', 'assets/weapons/sword.svg',160,160);
}

function create(){
    ws = new WebSocket('ws://'+location.hostname+':8888');
    client();

    //mouse
    game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
    game.input.mouse.capture = true;

    game.stage.disableVisibilityChange = true;
    game.world.setBounds(0, 0, 2000, 2000);

    game.physics.startSystem(Phaser.Physics.ARCADE);

    field = game.add.tileSprite(0,0,2000,2000,'bg');
}

function update(){
    if(map.ready){
        if (game.input.activePointer.leftButton.isDown){
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
        }
        if (game.input.activePointer.rightButton.isDown){
            var rad = pointToRadian(
                player.position.x-game.camera.x,
                player.position.y-game.camera.y,
                game.input.x,
                game.input.y);
            player.rotation = rad;
            ws.send(JSON.stringify({
                status: 'attack',
                id: player.id,
                rotation: rad
            }));
        }

        //tween motion
        for(var i in tweens){
            tweens[i].update();
        };
    }
}

function render(){

}

//Initial
var field,player,shadows,shadows2,zombies,heroes,trees,rocks,weapons;
var creatures = {};
function init(){
    weapons = game.add.group();
    shadows = game.add.group();

    zombies = game.add.group();
    heroes = game.add.group();

    shadows2 = game.add.group();
    rocks = game.add.group();
    trees = game.add.group();
}

//update map
var map = {
    ready: false,
    init: function(e){
        for(var i in e.data){
            switch(e.data[i].type){
                case 'tree':
                    new Tree(e.data[i],e.data[i].type);
                    break;
                case 'rock':
                    new Rock(e.data[i],e.data[i].type);
                    break;
            }
        }

        //new player
        player = new Player(e.player);
        game.camera.follow(player);
        map.ready = true;
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
                case 'zombie':
                    if(obj){
                        obj.live(data[i]);
                    }else{
                        new Zombie(data[i]);
                    }
                    break;
            }
        }
    }
};