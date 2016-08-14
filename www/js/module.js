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
function distance(x1,y1,x2,y2){
    var dx = x1-x2;
    var dy = y1-y2;
    return Math.sqrt(dx*dx + dy*dy);
}

//Classes
tweens = {};
Tween = function(obj,id,data,time,slow){
    this.id = id;
    this.data = data;
    this.obj = obj;
    this.time = time;
    this.count = time;
    this.slow = (slow? 2:1);

    //diff
    if(data.x){
        this.dx = obj.x-data.x;
        this.mx = Math.abs(this.dx)/this.time;
    }
    if(data.y){
        this.dy = obj.y-data.y;
        this.my = Math.abs(this.dy)/this.time;
    }
    if(data.rotation){
        this.dr = obj.rotation-data.rotation;
        //reverse rotation
        this.cw = false;
        this.ccw = false;
        var tg = data.rotation*180/Math.PI;
        tg = (tg<0? 360+tg:tg);
        var t = obj.rotation*180/Math.PI;
        t = (t<0? 360+t:t);
        if(t>90 &&t<180 &&tg>180 &&tg<270){
            this.cw = true;
            this.dr = Math.abs(obj.rotation-3.14)+(data.rotation+3.14);
        }else if(tg>90 &&tg<180 &&t>180 &&t<270){
            this.ccw = true;
            this.dr = (obj.rotation+3.14)+Math.abs(data.rotation-3.14);
        }
        this.mr = Math.abs(this.dr)/(this.time*this.slow);
    }
    //console.log(t);Math.abs(this.dr/this.time)*2/this.rate;

    this.option = function(key){
        switch(key){
            case 'x':
                if(this.dx<0){
                    this.obj.x += this.mx;
                }else if(this.dx>0){
                    this.obj.x -= this.mx;
                }
                break;
            case 'y':
                if(this.dy<0){
                    this.obj.y += this.my;
                }else if(this.dy>0){
                    this.obj.y -= this.my;
                }
                break;
            case 'rotation':
                if(this.cw){
                    if(this.obj.rotation+this.mr>3.14){
                        this.obj.rotation = -3.14-(this.obj.rotation+this.mr-3.14);
                    }else{
                        this.obj.rotation += this.mr;
                    }
                }else if(this.ccw){
                    if(this.obj.rotation-this.mr<-3.14){
                        this.obj.rotation = 3.14-(this.obj.rotation-this.mr+3.14);
                    }else{
                        this.obj.rotation -= this.mr;
                    }
                }else{
                    if(this.dr<0){
                        this.obj.rotation += this.mr;
                    }else if(this.dr>0){
                        this.obj.rotation -= this.mr;
                    }
                }
                break;
        };
    }
    this.update = function(){
        if(this.count>0){
            for(var i in this.data){
                this.option(i);
            }
        }else{
            delete tweens[this.id];
        }
        this.count--;
    }
    tweens[this.id] = this;
}

Hero = function(data){
    var obj = heroes.create(data.x, data.y, 'hero');
    obj.id = data.id;
    obj.scale.set(data.scale);
    obj.anchor.setTo(0.5, 0.5);
    obj.animations.add('hit');
    obj.events.onAnimationComplete.add(function(){
        obj.frame = 0;
    });

    obj.shadow = {
        scale: data.shadow.scale,
        spread: data.shadow.spread
    };
    obj.shadowImage = shadows.create(
        data.x-data.radius+obj.shadow.spread,
        data.y-data.radius+obj.shadow.spread,
        'shadow');
    obj.shadowImage.scale.set(data.shadow.scale);

    //weapon
    obj.weapon = weapons.create(data.x, data.y, 'sword');
    obj.weapon.anchor.setTo(0.5, 0.5);
    obj.weapon.animations.add('slash');
    obj.weapon.events.onAnimationComplete.add(function(){
        obj.weapon.frame = 0;
    });

    obj.attack = function(){
        obj.weapon.animations.play('slash', 20, false);
    }
    obj.hit = function(){
        obj.animations.play('hit', 20, false);
    }

    obj.live = function(data){
        if(data.action.attack){
            obj.attack();
        }
        new Tween(obj, obj.id, {rotation:data.rotation, x:data.x, y:data.y}, 10);
        new Tween(obj.weapon, obj.id+'w', {rotation:data.rotation, x:data.x, y:data.y}, 10, true);
        new Tween(obj.shadowImage, obj.id+'s', {x:data.x-data.radius+obj.shadow.spread, y:data.y-data.radius+obj.shadow.spread}, 10);
        //obj.rotation = data.rotation;
        /*game.add.tween(obj).to({rotation:data.rotation, x:data.x, y:data.y}, 100, Phaser.Easing.Linear.None, true);
        game.add.tween(obj.weapon).to({rotation:data.rotation, x:data.x, y:data.y}, 100, Phaser.Easing.Linear.None, true);
        game.add.tween(obj.shadowImage).to({x:data.x-data.radius+obj.shadow.spread, y:data.y-data.radius+obj.shadow.spread}, 100, Phaser.Easing.Linear.None, true);*/
    }
    creatures[data.id] = obj;
    return obj;
}
Player = function(data){
    var obj = new Hero(data);
    return obj;
}

Tree = function(data,type){
    var obj = trees.create(data.x, data.y, type);
    obj.rotation = data.rotation;
    obj.scale.set(data.scale);
    obj.anchor.setTo(0.5, 0.5);
    obj.shadow = {
        scale: data.shadow.scale,
        spread: data.shadow.spread
    };
    obj.shadowImage = shadows2.create(
        data.x-data.radius+data.shadow.spread,
        data.y-data.radius+data.shadow.spread,
        'shadow');
    obj.shadowImage.scale.set(data.shadow.scale);
    return obj;
}
Rock = function(data,type){
    var obj = rocks.create(data.x, data.y, type);
    obj.rotation = data.rotation;
    obj.scale.set(data.scale);
    obj.anchor.setTo(0.5, 0.5);
    obj.shadow = {
        scale: data.shadow.scale,
        spread: data.shadow.spread
    };
    obj.shadowImage = shadows2.create(
        data.x-data.radius+data.shadow.spread,
        data.y-data.radius+data.shadow.spread,
        'shadow');
    obj.shadowImage.scale.set(data.shadow.scale);
    return obj;
}