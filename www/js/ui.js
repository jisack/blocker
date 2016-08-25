//Buttons
var button = {};
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

//UI
Selector = function(data){
    var div = document.createElement('div');
    div.className = 'selector';

    div.i = 1;
    div.list = [];
    div.left = document.createElement('button');
    div.left.className = 'ui-left';
    div.appendChild(div.left);
    //jobs
    for(var i in data){
        var img = document.createElement('img');
        img.src = 'assets/'+ui.team+'/model.'+data[i]+'.png';
        img.data = data[i];
        div.list.push(img);
        div.appendChild(img);
    }
    div.right = document.createElement('button');
    div.right.className = 'ui-right';
    div.appendChild(div.right);

    div.clear = function(){
        for(var i in div.list){
            div.list[i].style.display = 'none';
        }
        var img = div.list[div.i];
        img.style.display = 'inline-block';
        ui.job = img.data;
        img.src = 'assets/'+ui.team+'/model.'+ui.job+'.png';
        div.current = img;
        ui.playable();
    }
    div.left.onclick = function(){
        div.i = (div.i-1>=0 ? div.i-1:div.list.length-1);
        div.clear();
    }
    div.right.onclick = function(){
        div.i = (div.i+1>div.list.length-1 ? 0:div.i+1);
        div.clear();
    }
    do{
        div.right.click();
    }while(ui.job!=ui.lastJob);

    div.left.click();
    return div;
}
Container = function(){
    var div = document.createElement('div');
    div.className = 'container';
    return div;
}
StartUI = function(){
    var div = new Container();
    div.logo = document.createElement('div');
    div.logo.id = 'logo';

    div.left = document.createElement('div');
    div.left.className = 'left';
    div.left.style.display = 'inline-block';
    div.right = document.createElement('div');
    div.right.className = 'right';
    div.right.style.display = 'inline-block';
    div.top = document.createElement('div');
    div.top.className = 'top';

    div.name = document.createElement('input');
    div.name.maxLength = 8;
    div.name.placeholder = 'Enter Name';
    div.name.value = localStorage.getItem('name')||'';
    div.name.onkeyup = function(){
        ui.playable();
    }
    div.play = document.createElement('button');
    div.play.className = 'play';
    div.play.textContent = 'Play';
    div.play.onclick = function(){
        socket.emit('message',JSON.stringify({
            status: 'join',
            id: playId,
            name: div.name.value,
            team: ui.team,
            job: ui.job
        }));
    }

    div.red = document.createElement('button');
    div.red.className = 'selected';
    div.red.style.background = '#DE4330';
    div.red.onclick = function(){
        ui.team = 'A';
        div.selector.current.src = 'assets/'+ui.team+'/model.'+ui.job+'.png';
        div.red.className = 'selected';
        div.blue.className = '';
        ui.playable();
    }
    div.blue = document.createElement('button');
    div.blue.style.background = '#2960AD';
    div.blue.onclick = function(){
        ui.team = 'B';
        div.selector.current.src = 'assets/'+ui.team+'/model.'+ui.job+'.png';
        div.red.className = '';
        div.blue.className = 'selected';
        ui.playable();
    }
    div.top.appendChild(div.red);
    div.top.appendChild(div.blue);

    div.selector = new Selector(Game.jobs);

    div.left.appendChild(div.name);
    div.left.appendChild(div.play);
    div.right.appendChild(div.top);
    div.right.appendChild(div.selector);
    div.appendChild(div.logo);
    div.appendChild(div.left);
    div.appendChild(div.right);
    return div;
}

var body = document.body||document.documentElement;
var ui = {
    playable: function(){
        if(ui.current){
            /*if(ui.job=='ranger'){
                ui.current.play.disabled = true;
            }else */if(ui.current.name.value==''){
                ui.current.play.disabled = true;
            }else{
                ui.current.play.disabled = false;
            }
        }
    },
    start: function(){
        var team = ['A','B'];
        ui.team = localStorage.getItem('team')||team[Math.floor(Math.random()*2)];
        ui.lastJob = localStorage.getItem('job')||'warrior';
        ui.current = new StartUI();
        body.appendChild(ui.current);
        //default
        if(ui.team=='B'){
            ui.current.blue.click();
        }
        ui.current.name.focus();
    },
};
ui.start();