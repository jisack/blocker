function uuid(){
	function s4() {
		return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
	}
	return s4()+s4()+'-'+s4()+'-'+s4()+'-'+s4()+'-'+s4()+s4()+s4();
}

var ws;

function client(){
    ws.onmessage = function(e){
        var data = JSON.parse(e.data);

        switch(data.status){
            case 'init':
                map.init(data);
                break;
            case 'update':
                map.update(data.data);
                break;
            case 'leave':
                creatures[data.id].destroy(true);
                delete creatures[data.id];
                break;
        }
    }

    ws.onopen = function(e){
        init();
        ws.send(JSON.stringify({
            status:'join',
            id:uuid(),
            name:'Unknown'
        }));
        console.log('Connected');
    }

    ws.onerror = function(e){
        console.log('Error: '+e);
    }

    ws.onclose = function(e){
        console.log('Disconnected');
    }
}

window.onunload = function(e){
    ws.close();
}