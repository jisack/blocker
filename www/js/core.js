var mobile = false;
if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    mobile = true;
}

var game = new Phaser.Game('100%', '100%', Phaser.AUTO, 'Blocker', { preload: preload, create: create, update: update, render: render}, false, false);

function preload(){
    //textures
    game.load.image('bg', 'assets/bg.svg');
    game.load.image('shadow', 'assets/shadow.svg');
    game.load.image('rock', 'assets/rock.svg');
    game.load.image('tree', 'assets/tree.svg');
    game.load.spritesheet('tower', 'assets/tower.svg',80,80);
    
    //ui
    game.load.image('move', 'assets/ui/move.svg');
    game.load.image('attack', 'assets/ui/attack.svg');

    //fx
    game.load.image('flake', 'assets/fx/flake.svg');
    
    //creatures
    game.load.spritesheet('zombie', 'assets/zombie.svg',46,46);
    game.load.image('hands', 'assets/weapons/hands.svg');

    game.load.spritesheet('Awarrior', 'assets/A/warrior.svg',46,46);
    game.load.spritesheet('Aarcher', 'assets/A/archer.svg',46,46);
    game.load.spritesheet('Bwarrior', 'assets/B/warrior.svg',46,46);
    game.load.spritesheet('Barcher', 'assets/B/archer.svg',46,46);

    //weapon
    game.load.spritesheet('sword', 'assets/weapons/sword.svg',160,160);
    game.load.spritesheet('bow', 'assets/weapons/bow.svg',160,160);
    game.load.image('arrow', 'assets/weapons/arrow.svg');

    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    game.scale.setResizeCallback(function(){
        game.scale.setMaximum();
        
        ui.current.style.left = (window.innerWidth/2)-(ui.current.offsetWidth/2)+'px';
        ui.current.style.top = (window.innerHeight/2)-(ui.current.offsetHeight/2)+'px';
    });
}

var size = 3000;
function create(){
    socket = io.connect('http://'+location.hostname+':8000');//new WebSocket('ws://'+location.hostname+':8888');
    client();

    //mouse
    game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
    game.input.mouse.capture = true;

    game.stage.disableVisibilityChange = true;
    game.world.setBounds(0, 0, size, size);

    //game.physics.startSystem(Phaser.Physics.ARCADE);

    field = game.add.tileSprite(0,0,size,size,'bg');

    game.camera.x = size-window.innerWidth/2;
    game.camera.y = size-window.innerHeight/2;
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

var lastMove = 0;
function update(){
    if(map.ready){
        if(player){
            updateUI();

            if (game.input.activePointer.leftButton.isDown || game.input.pointer1.isDown){
                var rad = (mobile? controllerRotation():playerRotation());
                var now = Date.now();
                player.rotation = rad;

                if(rad&& now-lastMove>50){
                    send({
                        status: 'move',
                        id: player.id,
                        rotation: rad
                    });
                    lastMove = now;
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
var field,player,zones,shadows,shadows2,shadows3,shots,names,zombies,heroes,trees,rocks,towers,weapons,effects;
var playId,creatures = {};
var button = {};

function init(){
    zones = game.add.group();
    weapons = game.add.group();
    shadows = game.add.group();

    shots = game.add.group();
    zombies = game.add.group();
    heroes = game.add.group();
    names = game.add.group();

    shadows2 = game.add.group();
    rocks = game.add.group();
    trees = game.add.group();
    shadows3 = game.add.group();
    towers = game.add.group();

    effects = game.add.group();

    playId = localStorage.getItem('uuid')||uuid();
    localStorage.setItem('uuid',playId);
}

//ui
function mobileUI(){
    if(mobile){
        button.move = game.add.sprite(game.camera.x, game.camera.y+window.innerHeight-256, 'move');
        button.attack = game.add.button(game.camera.x+window.innerWidth-256, game.camera.y+window.innerHeight-256, 'attack', function(){
            send({
                status: 'attack',
                id: player.id,
                rotation: player.rotation
            });
        }, this, 2, 1, 0);
    }
}

//update map
var map = {
    ready: false,
    init: function(e){
        for(var i in e.data){
            switch(e.data[i].type){
                case 'tree':
                    new Tree(e.data[i]);
                    break;
                case 'rock':
                    new Rock(e.data[i]);
                    break;
            }
        }
        map.ready = true;
    },
    play: function(e){
        //new player
        localStorage.setItem('name',ui.current.name.value);
        player = new Player(e.player);
        game.camera.follow(player);
        body.removeChild(ui.current);
        
        mobileUI();
    },
    //creatures
    update: function(data){
        for(var i in data){
            var obj = creatures[data[i].id];

            if(obj){
                obj.live(data[i]);
            }else{
                switch(data[i].type){
                    case 'hero':
                        new Hero(data[i]);
                        break;
                    case 'zombie':
                        new Zombie(data[i]);
                        break;
                    ////
                    case 'arrow':
                        new Arrow(data[i]);
                        break;
                    case 'tower':
                        new Tower(data[i]);
                        break;
                }
            }
        }
    }
};