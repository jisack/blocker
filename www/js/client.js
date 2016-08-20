function uuid(){
	function s4() {
		return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
	}
	return s4()+s4()+'-'+s4()+'-'+s4()+'-'+s4()+'-'+s4()+s4()+s4();
}

var socket;

function send(data){
    socket.emit('message',JSON.stringify(data));
}

function client(){
    socket.on('message', function(e){
        var data = JSON.parse(e);

        switch(data.status){
            case 'init':
                map.init(data);
                break;
            case 'play':
                map.play(data);
                break;
            case 'update':
                map.update(data.data);
                break;
            case 'leave':
                creatures[data.id].destroy(true);
                delete creatures[data.id];
                break;
        }
    });

    socket.on('connect', function(e){
        init();
        socket.emit('message',JSON.stringify({
            status:'load'
        }));
        console.log('Connected');
    });

    socket.on('error', function(e){
        console.log('Error: '+e);
    });

    socket.on('disconnect', function(e){
        console.log('Disconnected');
    });
}

window.onbeforeunload = function(e){
    socket.disconnect();
}