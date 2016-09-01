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
function pointToRadian(x1,y1,x2,y2){
    return Math.atan2(y1-y2,x1-x2);
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
    this.collide = function(ctr,disable){
        if(this!=ctr){
            var dist = distance(ctr.x,ctr.y,this.x,this.y);
            if(this.radius+ctr.radius > dist){
                if(!disable){
                    var normX = ((this.x+ctr.radius) - (ctr.x+this.radius)) / dist;
                    var normY = ((this.y+ctr.radius) - (ctr.y+this.radius)) / dist;
                    
                    ctr.x = (this.x+ctr.radius) - (normX*(this.radius+ctr.radius)) - this.radius;
                    ctr.y = (this.y+ctr.radius) - (normY*(this.radius+ctr.radius)) - this.radius;
                }
                return true;
            }else{
                return false;
            }
        }
    }
}
Creature = function(x,y){
    var org = new Origin(x,y);
    org.stat = {
        hp: 5,
        mhp: 5,
        sp: 0,
        msp: 20,
        atk: 1,
        spd: Game.SPEED,
        ospd: Game.SPEED
    };
    org.zone = 500;
    org.team = 'none';

    return org;
}

//constant
Game = {};
Game.SPEED = 25;
Game.JOB_WARRIOR = 1;
Game.JOB_ARCHER = 2;
//Game.JOB_SPEED = {'warrior':Game.SPEED-2, 'ranger':Game.SPEED};
Game.JOB_MSP = {'warrior':8, 'ranger':12, 'warlock':11, 'doctor':20};
Game.JOB_ATTACK = {'warrior':8, 'ranger':12, 'warlock':11, 'doctor':20};

//weapons
Arrow = function(data){
    var org = new Origin(data.x,data.y);
    org.owner = data.owner;
    org.team = data.team;
    org.type = 'arrow';
    org.damage = 1;
    org.radius = 5;
    org.rotation = data.rotation;
    org.life = 10;
    org.action = {};

    org.update = function(){
        if(org.life>0){
            if(map.collide(org)){
                org.life = 0;
            }
            for(var i in map.creatures){
                var e = map.creatures[i];
                var collided = e.collide(org,true);
                if(collided && e.id!=org.owner && e.action.attack){
                    org.action.collided = true;
                    org.life = 0;
                    break;
                }else if(collided && e.id!=org.owner){
                    if(e.team!=org.team) e.stat.hp -= org.damage;
                    e.action.hit = true;
                    org.life = 0;
                    break;
                }
            }
            for(var i in map.obstacles){
                if(map.obstacles[i].collide(org,true)){
                    org.life = 0;
                    break;
                }
            }
        }

        //moving
        if(org.life>0){
            org.x -= Math.cos(org.rotation)*60;
            org.y -= Math.sin(org.rotation)*60;
        }
        org.life--;
    }
    org.clear = function(){
        delete map.shots[org.id];
    }
    org.getData = function(){
        var data = org.data();
        //data.life = org.life;
        data.action = org.action;
        if(org.life<0) org.clear();
        return data;
    }

    map.shots[org.id] = org;
    return org;
}
Frost = function(data){
    var org = new Arrow(data);
    org.owner = data.owner;
    org.type = 'frost';
    org.damage = 1;
    org.radius = 10;
    org.life = 10;

    org.update = function(){
        if(org.life>0){
            if(map.collide(org)){
                org.life = 0;
            }
            for(var i in map.creatures){
                var e = map.creatures[i];
                var collided = e.collide(org,true);

                if(collided && e.id!=org.owner && e.action.attack){
                    org.action.collided = true;
                    org.life = 0;
                    break;
                }else if(collided && e.id!=org.owner){
                    var old = e.stat.ospd;
                    e.stat.spd = e.stat.spd/2;
                    if(e.team!=org.team) e.stat.hp -= org.damage;
                    e.action.hit = true;
                    setTimeout(function(){
                        e.stat.spd = old;
                    },2000);
                    org.life = 0;
                    break;
                }
            }
            for(var i in map.obstacles){
                if(map.obstacles[i].collide(org,true)){
                    org.life = 0;
                    break;
                }
            }
        }
        
        //moving
        if(org.life>0){
            org.x -= Math.cos(org.rotation)*30;
            org.y -= Math.sin(org.rotation)*30;
        }
        org.life--;
    }

    map.shots[org.id] = org;
    return org;
}
Potion = function(data){
    var org = new Arrow(data);
    org.owner = data.owner;
    org.team = data.team;
    org.type = 'potion';
    org.damage = 1;
    org.radius = 10;
    org.life = Math.ceil(Math.random()*4)+2;
    org.time = 60;
    org.action = {};

    org.update = function(){
        for(var i in map.creatures){
            var e = map.creatures[i];
            var collided = e.collide(org,true);
            if(collided && e.team==org.team && e.id!=org.owner){
                e.stat.hp += org.damage;
                e.action.heal = true;
                org.life = 0;
                org.action.collided = true;
                break;
            }else if(collided && e.team!=org.team && e.id!=org.owner){
                e.stat.hp -= org.damage;
                e.action.hit = true;
                org.life = 0;
                org.action.collided = true;
                break;
            }
        }
        for(var i in map.obstacles){
            if(map.obstacles[i].collide(org,true)){
                org.life = 0;
                org.action.collided = true;
                break;
            }
        }

        //moving
        if(org.life>0 && !org.action.collided){
            org.x -= Math.cos(org.rotation)*30;
            org.y -= Math.sin(org.rotation)*30;
        }

        if(org.time<=0) org.action.collided = true;
        org.life--;
        org.time--;
    }
    org.getData = function(){
        var data = org.data();
        //data.life = org.life;
        data.action = org.action;
        if(org.action.collided){
            org.clear();
        }
        return data;
    }

    map.shots[org.id] = org;
    return org;
}

User = function(socket){
    return {socket: socket};
}
Hero = function(socket,data){
    //spawn at base
    var towers = [];
    var x = map.randomX();
    var y = map.randomY()
    for(var i in map.towers){
        if(map.towers[i].team==data.team) towers.push(map.towers[i]);
    }
    if(towers.length>0){
        var t = towers[Math.floor(Math.random()*towers.length)];
        x = t.x;
        y = t.y;
    }

    var ctr = new Creature(x,y);
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

    //job
    ctr.stat.sp = Game.JOB_MSP[ctr.job];
    ctr.stat.msp = Game.JOB_MSP[ctr.job];

    ctr.attack = function(){
        if(ctr.stat.sp>=Game.JOB_ATTACK[ctr.job]){
            ctr.stat.sp -= Game.JOB_ATTACK[ctr.job];
            ctr.action.attack = true;
            
            switch(ctr.job){
                case 'warrior':
                    function attack(e){
                        if(e!=ctr){
                            var dx = Math.cos(ctr.rotation)*Game.SPEED;
                            var dy = Math.sin(ctr.rotation)*Game.SPEED;
                            var fx = ctr.x - dx;
                            var fy = ctr.y - dy;
                            var dist = distance(e.x,e.y,fx,fy);
                            if(40+e.radius > dist){
                                e.dx = dx;
                                e.dy = dy;
                                e.x -= dx*2;
                                e.y -= dy*2;
                                if(e.team!=ctr.team) e.stat.hp--;
                                e.action.hit = true;
                            }
                        }
                    }
                    for(var i in map.creatures){
                        attack(map.creatures[i]);
                    }
                    break;

                case 'ranger':
                    new Arrow({
                        owner: ctr.id,
                        team: ctr.team,
                        x: ctr.x,
                        y: ctr.y,
                        rotation: ctr.rotation
                    });
                    break;

                case 'warlock':
                    new Frost({
                        owner: ctr.id,
                        team: ctr.team,
                        x: ctr.x,
                        y: ctr.y,
                        rotation: ctr.rotation
                    });
                    break;

                case 'doctor':
                    new Potion({
                        owner: ctr.id,
                        team: ctr.team,
                        x: ctr.x,
                        y: ctr.y,
                        rotation: ctr.rotation
                    });
                    break;
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
        if(ctr.stat.hp<=0) ctr.stat.hp = 0;
        if(ctr.stat.hp>ctr.stat.mhp) ctr.stat.hp = ctr.stat.mhp;
        if(ctr.stat.sp<ctr.stat.msp) ctr.stat.sp++;
        
        //clear status
        setTimeout(function(){
            ctr.reset();
        },1);
    }
    ctr.reset = function(){
        ctr.action = {};
    }
    ctr.clear = function(){
        setTimeout(function(){
            new Zombie(ctr.x,ctr.y);
        },3000);
        delete map.creatures[ctr.id];
    }
    ctr.leave = function(){
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
        //special
        if(ctr.text){
            data.text = ctr.text;
            delete ctr.text;
        }
        if(ctr.stat.hp<=0) ctr.clear();
        if(ctr.action.left) ctr.leave();
        return data;
    }

    map.creatures[ctr.id] = ctr;
    return ctr;
}

//monsters
Monster = function(x,y){
    var ctr = new Creature(x||map.randomX(), y||map.randomY());
    ctr.action = {};
    ctr.stat.hp = 2;
    ctr.stat.spd = 15;
    ctr.stat.ospd = 15;
    ctr.time = 0;

    ctr.reset = function(){
        ctr.action = {};
    }
    ctr.clear = function(){
        delete map.creatures[ctr.id];
        delete users[ctr.id];
    }
    ctr.getData = function(){
        var data = ctr.data();
        data.hp = ctr.stat.hp;
        data.action = ctr.action;
        if(ctr.stat.hp<=0) ctr.clear();
        return data;
    }
    return ctr;
}
Zombie = function(x,y){
    var mon = new Monster(x,y);
    mon.type = 'zombie';
    mon.zone = 300;
    mon.stat.msp = 25;

    mon.update = function(){
        if(mon.time<=0 ||mon.action.hit){
            mon.time = Math.floor(Math.random()*30);
            mon.rotation = (Math.random()*Math.PI)*(Math.random()<0.5 ? -1:1);
        }

        var closetDist = 1000;
        var closet = null;
        map.collide(mon);
        for(var i in map.creatures){
            var e = map.creatures[i];
            e.collide(mon);
            if(!mon.target){
                if(e!=mon && e.team!=mon.team &&e.stat.hp>0){
                    var dist = distance(mon.x,mon.y,e.x,e.y);
                    if(closetDist>dist && mon.zone>dist){
                        closetDist = dist;
                        closet = e;
                    }
                }
            }
        }

        //targeting
        if(closet){
            mon.target = closet;
        }
        if(!mon.target){
            mon.dx = Math.cos(mon.rotation)*mon.stat.spd;
            mon.dy = Math.sin(mon.rotation)*mon.stat.spd;
        }else if(distance(mon.x,mon.y, mon.target.x,mon.target.y)<mon.zone){
            var e = mon.target;
            var rad = pointToRadian(mon.x,mon.y, e.x,e.y);
            mon.rotation = rad;
            mon.dx = Math.cos(rad)*mon.stat.spd;
            mon.dy = Math.sin(rad)*mon.stat.spd;      
            
            //attack
            var dx = Math.cos(mon.rotation)*15;
            var dy = Math.sin(mon.rotation)*15;
            var fx = mon.x - dx;
            var fy = mon.y - dy;
            var dist = distance(e.x,e.y,fx,fy);
            if(e.radius*1.6>dist && mon.stat.sp>=25){
                mon.stat.sp -= 25;
                e.stat.hp--;
                e.action.hit = true;
                mon.action.attack = true;

                if(e.stat.hp<=0){
                    delete mon.target;
                }
            }
        }else{
            delete mon.target;
        }
        mon.x -= mon.dx;
        mon.y -= mon.dy;
        mon.time--;
        
        for(var i in map.obstacles){
            map.obstacles[i].collide(mon);
        }

        //regenration
        if(mon.stat.sp<mon.stat.msp) mon.stat.sp++;

        //clear status
        setTimeout(function(){
            mon.reset();
        },1);
    }

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
    org.zone = 500;
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
    org.collide = function(ctr,disable){
        if(org.intersect(ctr)){
            if(!disable){
                var halfWidth = org.width/2;
                var halfHeight = org.height/2;
                var dx = Math.abs(ctr.dx);
                var dy = Math.abs(ctr.dy);

                if(dx>dy){
                    if(ctr.x+ctr.radius > org.x-halfWidth && ctr.x+ctr.radius < org.x){
                        ctr.x = org.x-halfWidth-ctr.radius;
                    }else if(ctr.x-ctr.radius < org.x+halfWidth && ctr.x-ctr.radius > org.x){
                        ctr.x = org.x+halfWidth+ctr.radius;
                    }else if(ctr.y+ctr.radius > org.y-halfWidth && ctr.y+ctr.radius < org.y){
                        ctr.y = org.y-halfWidth-ctr.radius;
                    }else if(ctr.y-ctr.radius < org.y+halfWidth && ctr.y-ctr.radius > org.y){
                        ctr.y = org.y+halfWidth+ctr.radius;
                    }
                }
                else if(dx<dy){
                    if(ctr.y+ctr.radius > org.y-halfWidth && ctr.y+ctr.radius < org.y){
                        ctr.y = org.y-halfWidth-ctr.radius;
                    }else if(ctr.y-ctr.radius < org.y+halfWidth && ctr.y-ctr.radius > org.y){
                        ctr.y = org.y+halfWidth+ctr.radius;
                    }else if(ctr.x+ctr.radius > org.x-halfWidth && ctr.x+ctr.radius < org.x){
                        ctr.x = org.x-halfWidth-ctr.radius;
                    }else if(ctr.x-ctr.radius < org.x+halfWidth && ctr.x-ctr.radius > org.x){
                        ctr.x = org.x+halfWidth+ctr.radius;
                    }
                }
            }
            return true;
        }else{
            return false;
        }
    }
    org.update = function(){
        var Ainvaded = false;
        var Binvaded = false;
        var Cinvaded = false;
        for(var i in map.creatures){
            var ctr = map.creatures[i];
            var dist = distance(ctr.x,ctr.y,org.x,org.y);
            if(dist<org.zone){
                if(ctr.team=='A'){
                    Ainvaded = true;
                }else if(ctr.team=='B'){
                    Binvaded = true;
                }else if(ctr.team=='C'){
                    Cinvaded = true;
                }
            }
        }
        if((org.team=='none'||org.team=='B'||org.team=='C') &&Ainvaded &&!Binvaded &&!Cinvaded){
            org.team = 'A';
        }else if((org.team=='none'||org.team=='A'||org.team=='C') &&!Ainvaded &&Binvaded &&!Cinvaded){
            org.team = 'B';
        }else if((org.team=='none'||org.team=='A'||org.team=='B') &&!Ainvaded &&!Binvaded &&Cinvaded){
            org.team = 'C';
        }
        /*else if(!Ainvaded &&!Binvaded){
            org.team = 'none';
        }*/
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
    size: 3000,
    randomX: function(){
        return Math.floor(Math.random()*map.size);
    },
    randomY: function(){
        return Math.floor(Math.random()*map.size);
    },
    grids: {},
    towers: {},
    obstacles: {},
    creatures: {},
    shots: {},
    collide: function(ctr){
        if(ctr.x-ctr.radius<0){
            ctr.x = 0+ctr.radius;
            return true;
        }else if(ctr.x>map.size+ctr.radius){
            ctr.x = map.size+ctr.radius;
            return true;
        }else if(ctr.y-ctr.radius<0){
            ctr.y = 0+ctr.radius;
            return true;
        }else if(ctr.y>map.size+ctr.radius){
            ctr.y = map.size+ctr.radius;
            return true;
        }else{
            return false;
        }
    }
};
init();