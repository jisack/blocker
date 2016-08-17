var mobile = false;
if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    mobile = true;
}

var game = new Phaser.Game('100%', '100%', Phaser.CANVAS, 'RPG', { preload: preload, create: create, update: update, render: render});

function preload(){
    //textures
    game.load.image('bg', 'assets/bg.svg');
    game.load.image('shadow', 'assets/shadow.svg');
    game.load.image('rock', 'assets/rock.svg');
    game.load.image('tree', 'assets/tree.svg');
    
    //ui
    game.load.image('move', 'assets/ui/move.svg');
    game.load.image('attack', 'assets/ui/attack.svg');

    //fx
    game.load.image('flake', 'assets/fx/flake.svg');
    
    //creatures
    game.load.spritesheet('zombie', 'assets/zombie.svg',46,46);
    game.load.image('hands', 'assets/weapons/hands.svg');
    game.load.spritesheet('hero', 'assets/hero.svg',46,46);
    game.load.spritesheet('sword', 'assets/weapons/sword.svg',160,160);

    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    game.scale.setResizeCallback(function(){
        game.scale.setMaximum();
    });
}

function create(){
    socket = io.connect('http://'+location.hostname+':8000');//new WebSocket('ws://'+location.hostname+':8888');
    client();

    //mouse
    game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
    game.input.mouse.capture = true;

    game.stage.disableVisibilityChange = true;
    game.world.setBounds(0, 0, 2000, 2000);

    game.physics.startSystem(Phaser.Physics.ARCADE);

    field = game.add.tileSprite(0,0,2000,2000,'bg');
}

function playerRotation(){
    var rad = pointToRadian(
        player.position.x-game.camera.x,
        player.position.y-game.camera.y,
        game.input.x,
        game.input.y);
    return rad;
}
function controllerRotation(){
    var rad = pointToRadian(
        60,
        window.innerHeight-60,
        game.input.x,
        game.input.y);
    return (game.input.x<window.innerWidth/2 && 
        game.input.y>window.innerHeight/2? rad:null);
}

function updateUI(){
    if(mobile){
        button.move.x = game.camera.x+20;
        button.move.y = game.camera.y+window.innerHeight-100;
        button.attack.x = game.camera.x+window.innerWidth-100;
        button.attack.y = game.camera.y+window.innerHeight-100;
    }
}

function update(){
    if(map.ready){
        updateUI();

        if (game.input.activePointer.leftButton.isDown || game.input.pointer1.isDown){
            var rad = (mobile? controllerRotation():playerRotation());
            if(rad){
                player.rotation = rad;
                send({
                    status: 'move',
                    id: player.id,
                    rotation: rad
                });
            }
        }
        if (game.input.activePointer.rightButton.isDown){
            var rad = playerRotation();
            player.rotation = rad;
            send({
                status: 'attack',
                id: player.id,
                rotation: rad
            });
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
var playId,creatures = {};
var button = {};

function init(){
    weapons = game.add.group();
    shadows = game.add.group();

    zombies = game.add.group();
    heroes = game.add.group();

    shadows2 = game.add.group();
    rocks = game.add.group();
    trees = game.add.group();

    emitter = game.add.emitter(-100,-100,5);
    emitter.makeParticles('flake');
    emitter.gravity = 100;

    playId = localStorage.getItem('uuid')||uuid();
    localStorage.setItem('uuid',playId);
    ui();
}

//ui
function ui(){
    if(mobile){
        button.move = game.add.sprite(game.camera.x, game.camera.y+window.innerHeight-256, 'move');
        button.attack = game.add.button(game.camera.x+window.innerWidth-256, game.camera.y+window.innerHeight-256, 'attack', function(){
            ws.send(JSON.stringify({
                status: 'attack',
                id: player.id,
                rotation: player.rotation
            }));
        }, this, 2, 1, 0);

        button.move.scale.setTo(2, 2);
        button.attack.scale.setTo(2, 2);
    }
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