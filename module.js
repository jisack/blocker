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
        spd: 25
    };
    return org;
}

//constant
Game = {};
Game.JOB_WARRIOR = 1;
Game.JOB_ARCHER = 2;

Hero = function(ws,data){
    var ctr = new Creature(map.randomX(),map.randomY());
    ctr.id = data.id;
    ctr.type = 'hero';
    ctr.ws = ws;
    ctr.name = data.name;
    ctr.kill = 0;
    ctr.assist = 0;
    ctr.job = Game.JOB_WARRIOR;
    ctr.action = {};

    ctr.attack = function(){
        if(ctr.stat.sp>=10){
            ctr.stat.sp -= 10;
            ctr.action.attack = true;
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

        }
        if(ctr.stat.sp<ctr.stat.msp){
            ctr.stat.sp++;
        }
        setTimeout(function(){
            ctr.reset();
        },1);
    }
    ctr.reset = function(){
        if(ctr.action.attack) delete ctr.action.attack;
    }
    ctr.getData = function(){
        var data = ctr.data();
        data.action = ctr.action;
        return data;
    }

    map.creatures.push(ctr);
    return ctr;
}

//obstacle
Tree = function(x,y){
    var org = new Origin(x,y);
    org.type = 'tree';
    org.scale = (Math.random()*3)+1;
    org.shadow.scale = org.scale;
    org.shadow.spread *= org.scale;
    org.image = Math.floor(Math.random()*3);
    
    map.obstacles.push(org);
    return org;
}

Rock = function(x,y){
    var org = new Origin(x,y);
    org.type = 'rock';
    org.scale = (Math.random()*1)+0.5;
    org.shadow.scale = org.scale;
    org.shadow.spread *= org.scale;
    //org.radius *= org.scale;
    //org.width = 40;
    //org.height = 40;
    org.image = Math.floor(Math.random()*3);

    /*org.intersect = function(ctr){
        var distX = Math.abs(ctr.x - org.x-org.width/2);
        var distY = Math.abs(ctr.y - org.y-org.height/2);

        if (distX > (org.width/2 + ctr.radius)) { return false; }
        if (distY > (org.height/2 + ctr.radius)) { return false; }

        if (distX <= (org.width/2)) { return true; } 
        if (distY <= (org.height/2)) { return true; }

        var dx=distX-org.width/2;
        var dy=distY-org.height/2;
        return (dx*dx+dy*dy<=(ctr.radius*ctr.radius));
    }
    org.collide = function(ctr){
        if(org.intersect(ctr)){
            
        }
    }*/
    map.obstacles.push(org);
    return org;
}

//map
var map = {
    width: 2000,
    height: 2000,
    randomX: function(){
        return Math.floor(Math.random()*map.width);
    },
    randomY: function(){
        return Math.floor(Math.random()*map.height);
    },
    obstacles: [],
    creatures: [],
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