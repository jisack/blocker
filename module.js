//utility
function uuid(){
	function s4() {
		return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
	}
	return s4()+s4()+'-'+s4()+'-'+s4()+'-'+s4()+'-'+s4()+s4()+s4();
}

Point = function(x,y){
	this.x = x;
	this.y = y;
}
function dotProduct(x1,y1,x2,y2){
	return (x1*x2 + y1*y2);
}
function distance(x1,y1,x2,y2){
    var dx = x1-x2;
    var dy = y1-y2;
    return Math.sqrt(dx*dx + dy*dy);
}

//class
Origin = function(x,y){
    this.id = uuid();
    this.type = 'none';
    this.radius = 30;
    this.x = x;
    this.y = y;
    this.scale = 1;
    this.rotation = (1.57*Math.floor(Math.random()*3)*Math.floor(Math.random()*(-1)));
    this.shadow = {scale:1,spread:15};
    this.data = function(){
        return {
            id: this.id,
            type: this.type,
            x: this.x-this.radius,
            y: this.y-this.radius,
            radius: this.radius*this.scale,
            scale: this.scale,
            rotation: this.rotation,
            shadow: this.shadow
        };
    }
    this.getData = function(){
        return this.data();
    }
    this.collide = function(ctr){
        if(this!=ctr){
            var dist = distance(ctr.x,ctr.y,this.x,this.y);
            if(this.radius+ctr.radius > dist){
                var normX = ((this.x+ctr.radius) - (ctr.x+this.radius)) / dist;
                var normY = ((this.y+ctr.radius) - (ctr.y+this.radius)) / dist;
                
                ctr.x = (this.x+ctr.radius) - (normX*(this.radius+ctr.radius)) - this.radius;
                ctr.y = (this.y+ctr.radius) - (normY*(this.radius+ctr.radius)) - this.radius;
            }
        }
    }
}
Creature = function(x,y){
    var org = new Origin(x,y);
    org.stat = {
        hp: 5,
        sp: 10,
        msp:10,
        atk: 1,
        spd: Game.SPEED
    };
    org.zone = 500;

    return org;
}

//constant
Game = {};
Game.SPEED = 25;
Game.JOB_WARRIOR = 1;
Game.JOB_ARCHER = 2;

Hero = function(socket,data){
    var ctr = new Creature(map.randomX(),map.randomY());
    ctr.id = data.id;
    ctr.type = 'hero';
    ctr.socket = socket;
    ctr.socket.user = data.id;
    ctr.name = data.name;
    ctr.team = data.team;
    ctr.job = data.job;

    ctr.kill = 0;
    ctr.assist = 0;
    ctr.action = {};

    ctr.deadTick = 0;
    ctr.deadTime = 10;

    ctr.attack = function(){
        if(ctr.stat.sp>=10){
            ctr.stat.sp -= 10;
            ctr.action.attack = true;

            function attack(e){
                if(e!=ctr){
                    var dx = Math.cos(ctr.rotation)*Game.SPEED;
                    var dy = Math.sin(ctr.rotation)*Game.SPEED;
                    var fx = ctr.x - dx;
                    var fy = ctr.y - dy;
                    var dist = distance(e.x,e.y,fx,fy);
                    if(40+e.radius > dist){
                        e.x = e.x - dx*2;
                        e.y = e.y - dy*2;
                        e.stat.hp--;
                        e.action.hit = true;
                    }
                }
            }
            for(var i in map.creatures){
                attack(map.creatures[i]);
            }
        }
        
    }
    ctr.defend = function(){

    }

    ctr.update = function(){
        if(ctr.move){
            ctr.x = ctr.move.x;
            ctr.y = ctr.move.y;
            delete ctr.move;

            ctr.status = 'move';
        }
        map.collide(ctr);
        for(var i in map.creatures){
            map.creatures[i].collide(ctr);
        }
        for(var i in map.obstacles){
            map.obstacles[i].collide(ctr);
        }

        //stat
        if(ctr.stat.hp<=0){
            ctr.stat.hp = 0;
            
        }
        if(ctr.stat.sp<ctr.stat.msp){
            ctr.stat.sp++;
        }

        //clear status
        setTimeout(function(){
            ctr.reset();
        },1);
    }
    ctr.reset = function(){
        ctr.action = {};
    }
    ctr.clear = function(){
        delete map.creatures[ctr.id];
        delete users[ctr.id];
    }
    ctr.getData = function(){
        var data = ctr.data();
        data.name = ctr.name;
        data.team = ctr.team;
        data.job = ctr.job;
        //stat
        data.hp = ctr.stat.hp;
        data.action = ctr.action;
        if(ctr.action.left) ctr.clear();
        return data;
    }

    map.creatures[ctr.id] = ctr;
    return ctr;
}

//monsters
Monster = function(){
    var ctr = new Creature(map.randomX(),map.randomY());
    ctr.action = {};
    ctr.stat.spd = 15;
    ctr.time = 0;

    ctr.update = function(){
        if(ctr.time<=0 ||ctr.action.hit){
            ctr.time = Math.floor(Math.random()*30);
            ctr.rotation = (Math.random()*Math.PI)*(Math.random()<0.5 ? -1:1);
        }else{
            ctr.x -= Math.cos(ctr.rotation)*ctr.stat.spd;
            ctr.y -= Math.sin(ctr.rotation)*ctr.stat.spd;
            ctr.time--;
        }

        map.collide(ctr);
        for(var i in map.creatures){
            map.creatures[i].collide(ctr);
        }
        for(var i in map.obstacles){
            map.obstacles[i].collide(ctr);
        }

        //clear status
        setTimeout(function(){
            ctr.reset();
        },1);
    }
    ctr.reset = function(){
        ctr.action = {};
    }
    ctr.clear = function(){
        delete map.creatures[ctr.id];
        delete users[ctr.id];
    }
    ctr.getData = function(){
        var data = ctr.data();
        data.action = ctr.action;
        if(ctr.action.left) ctr.clear();
        return data;
    }
    return ctr;
}
Zombie = function(){
    var mon = new Monster();
    mon.type = 'zombie';

    map.creatures[mon.id] = mon;
    return mon;
}

//obstacle
Tree = function(x,y){
    var org = new Origin(x,y);
    org.type = 'tree';
    org.scale = (Math.random()*3)+1;
    org.shadow.scale = org.scale;
    org.shadow.spread *= org.scale;
    org.image = Math.floor(Math.random()*3);
    
    map.obstacles[org.id] = org;
    return org;
}

Rock = function(x,y){
    var org = new Origin(x,y);
    org.type = 'rock';
    org.width = 50;
    org.height = 50;
    org.scale = (Math.random()*1)+0.5;
    org.shadow.scale = org.scale;
    org.shadow.spread *= org.scale;
    //org.radius *= org.scale;
    org.image = Math.floor(Math.random()*3);
    
    map.obstacles[org.id] = org;
    return org;
}

Tower = function(x,y){
    var org = new Origin(x,y);
    org.type = 'tower';
    org.width = 90;
    org.height = 90;
    org.scale = 2.5;
    org.shadow.scale = 3.1;
    org.shadow.spread *= 2.5;
    org.zone = 700;
    org.team = 'none';

    org.intersect = function(ctr){
        var dx = Math.abs(ctr.x - org.x);
        var dy = Math.abs(ctr.y - org.y);

        if (dx > (org.width/2 + ctr.radius)) { return false; }
        if (dy > (org.height/2 + ctr.radius)) { return false; }

        if (dx <= (org.width/2)) { return true; } 
        if (dy <= (org.height/2)) { return true; }

        cornerDistance = Math.pow((dx - org.width/2),2) +
                            Math.pow((dy - org.height/2),2);

        return (cornerDistance <= Math.pow(ctr.radius,2));
    }
    org.collide = function(ctr){
        if(org.intersect(ctr)){
            var halfWidth = org.width/2;
            var halfHeight = org.height/2;
            if(ctr.x+ctr.radius > org.x-halfWidth && ctr.x+ctr.radius < org.x){
                ctr.x = org.x-halfWidth-ctr.radius;
            }else if(ctr.x-ctr.radius < org.x+halfWidth && ctr.x-ctr.radius > org.x){
                ctr.x = org.x+halfWidth+ctr.radius;
            }
            if(ctr.y+ctr.radius > org.y-halfWidth && ctr.y+ctr.radius < org.y){
                ctr.y = org.y-halfWidth-ctr.radius;
            }else if(ctr.y-ctr.radius < org.y+halfWidth && ctr.y-ctr.radius > org.y){
                ctr.y = org.y+halfWidth+ctr.radius;
            }
        }
    }
    org.update = function(){
        var Ainvaded = false;
        var Binvaded = false;
        for(var i in map.creatures){
            var ctr = map.creatures[i];
            var dist = distance(ctr.x,ctr.y,org.x,org.y);
            if(dist<org.zone){
                if(ctr.team=='A'){
                    Ainvaded = true;
                    break;
                }else if(ctr.team=='B'){
                    Binvaded = true;
                    break;
                }
            }
        }
        if((org.team=='none'||org.team=='B') &&Ainvaded &&!Binvaded){
            org.team = 'A';
        }else if((org.team=='none'||org.team=='A') &&!Ainvaded &&Binvaded){
            org.team = 'B';
        }
    }

    org.getData = function(){
        var data = org.data();
        data.team = org.team;
        data.zone = org.zone;
        return data;
    }

    map.towers[org.id] = org;
    map.obstacles[org.id] = org;
    return org;
}

//map
var map = {
    width: 4000,
    height: 4000,
    randomX: function(){
        return Math.floor(Math.random()*map.width);
    },
    randomY: function(){
        return Math.floor(Math.random()*map.height);
    },
    towers: {},
    obstacles: {},
    creatures: {},
    collide: function(ctr){
        if(ctr.x<0){
            ctr.x = 0+ctr.radius;
        }else if(ctr.x>map.width){
            ctr.x = map.width-ctr.radius;
        }else if(ctr.y<0){
            ctr.y = 0+ctr.radius;
        }else if(ctr.y>map.height){
            ctr.y = map.height-ctr.radius;
        }
    }
};
init();