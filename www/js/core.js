var game = new Phaser.Game('100%', '100%', Phaser.CANVAS, 'RPG', { preload: preload, create: create, update: update, render: render});

function preload(){
    game.load.image('bg', 'assets/bg.svg');
    game.load.image('shadow', 'assets/shadow.svg');
    game.load.image('hero', 'assets/hero.svg');
    game.load.image('rock', 'assets/rock.svg');
    game.load.image('tree', 'assets/tree.svg');
    game.load.image('sword', 'assets/weapons/sword.svg');
}

function create(){
    ws = new WebSocket('ws://'+location.hostname+':8888');
    client();

    game.stage.disableVisibilityChange = true;
    game.world.setBounds(0, 0, 2000, 2000);

    game.physics.startSystem(Phaser.Physics.ARCADE);

    field = game.add.tileSprite(0,0,2000,2000,'bg');
}

function update(){
    if(map.ready){
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
        }
        for(var i in tweens){
            tweens[i].update();
        };
    }
}

function render(){

}

//Initial
var field,player,shadows,shadows2,heroes,trees,rocks,weapons;
var creatures = {};
function init(){
    weapons = game.add.group();
    shadows = game.add.group();
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
            }
        }
    }
};