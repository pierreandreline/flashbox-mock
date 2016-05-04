require('./collection.js');
var dispatcher = require('httpdispatcher');
var http = require('http');
var fs = require('fs');
console.log(__dirname);

var simulClientIp = "?";
//var databasePath = "C:\\Users\\Pierre-André\\Desktop\\Linaware\\Dev\\Subsea7\\dev\\serveur\\src\\database\\";
var databasePath = "server\\src\\database\\";

var Groups = new Collection(["name"]);
var StateLevels = new Collection(["name"]);
var StateModels = new Collection(["name"]);
var States = new Collection(["stateModel,stateIndex"]);
var Tags = new Collection(["name"]);

var server = http.createServer(handleRequest);

process.argv.forEach(function (val, index, array) {
  if (val.indexOf('=')) {
	var parameter = val.split('=');
	var value = parameter[1];
	var name = parameter[0].toUpperCase();
	switch (name) {
		case "CLIENTIP":
		case "SIMULCLIENTIP":
			simulClientIp = value;
			console.log("simulClientIp="+simulClientIp);
			break;
	}
  }
});

const PORT=8080; 
//var www = '/C/Users/Pierre-André/Desktop/Linaware/Dev/Subsea7/dev/ihm';
//var clientPath = "C:\\Users\\Pierre-André\\Desktop\\Linaware\\Dev\\Subsea7\\dev\\ihm";
var clientPath = "\\client";
//var www = 'ressources';
dispatcher.setStatic('');
dispatcher.setStaticDirname(clientPath);

function handleRequest(request, response){
    try {
        //log the request on console
        //console.log(request.method+" "+request.url);
		
        //Disptach
        dispatcher.dispatch(request, response);
    } catch(err) {
        console.log(err);
    }
}

addString = function(resp) {
	return "<string xmlns=\"http://linaware.eu/\">"+resp+"</string>";
}
	
//A sample GET request    
dispatcher.onGet("/page1", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Page One');
});    

//A sample POST request
dispatcher.onPost("/post1", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Got Post Data');
});

// getStateLevels    
dispatcher.onPost("/api/tags.asmx/getStateLevels", function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/xml'});
	fs.readFile(databasePath+"StateLevels.csv", function (error,data) {
		res.end(addString(JSON.stringify(StateLevels.collection)));
	});
});    

// getStateModels    
dispatcher.onPost("/api/tags.asmx/getStateModels", function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/xml'});
	res.end(addString(JSON.stringify(StateModels.collection)));
});    

// getStates
dispatcher.onPost("/api/tags.asmx/getStates", function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/xml'});
	res.end(addString(JSON.stringify(States.collection)));
});    

// getTags
dispatcher.onPost("/api/tags.asmx/getTags", function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
	var payload = JSON.parse(req.body.replace(new RegExp("'", 'g'),"\""));
	var startIndex = parseInt(payload.startIndex);
	var list = Tags.collection.slice(startIndex,startIndex+200);
	var slist = [];
	for(idx in list) {
		var tag = list[idx];
		var stag = {"TG_TG_ID":tag.id.toString(), "TG_Name": tag.name, "TG_Description":tag.description, "TG_SM_ID": tag.stateModelInstance ? tag.stateModelInstance.id : "", "TG_GR_ID": tag.groupInstance.id};
		slist.push(stag);
	}
	res.end(JSON.stringify({"d":JSON.stringify(slist)}));
});    

// setValue
dispatcher.onPost("/api/tags.asmx/setValue", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text'});
	var payload = JSON.parse(req.body.replace(new RegExp("'", 'g'),"\""));
	var tagName = payload.tagName;
	var value = payload.value;
	Tags.setValue(tagName,value);
	res.end(addString(JSON.stringify({"code":0, "message":"ok"})));
});    

// ack alarm
dispatcher.onPost("/api/tags.asmx/setAckAlarm", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text'});
	var payload = JSON.parse(req.body.replace(new RegExp("'", 'g'),"\""));
	var id = parseInt(payload.id);
	console.log("setAckAlarm","id",id);
	var tag = Tags.findById(id);
	if (tag != undefined) {
		if (!tag.ack) {
			tag.ack = true;
			tag.dt = new Date().getTime();
		}
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":0, "message":"ok"})));
	}
	else {
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":-1, "message":"variable inconnue"})));
	}
});    

// ack group alarm
dispatcher.onPost("/api/tags.asmx/setAckAlarmGroup", function(req, res) {
	var payload = JSON.parse(req.body.replace(new RegExp("'", 'g'),"\""));
	var id = payload.id;
	var group = Groups.findById(id);
	if (group != undefined) {
		Tags.forEach(function (tag) {
			if (tag.group.id == id) {
				if (!tag.ack) {
					tag.ack = true;
					tag.dt = new Date().getTime();
				}
			}
		});
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":0, "message":"ok"})));
	}
	else {
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":-1, "message":"groupe inconnu"})));
	}
});    

// inh alarm
dispatcher.onPost("/api/tags.asmx/setInhibitAlarm", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text'});
	var payload = JSON.parse(req.body.replace(new RegExp("'", 'g'),"\""));
	var id = parseInt(payload.id);
	console.log("setInhAlarm","id",id);
	var tag = Tags.findById(id);
	if (tag != undefined) {
		if (!tag.inh) {
			tag.inh = true;
			tag.dt = new Date().getTime();
			Tags.checkState(tag, true);
		}
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":0, "message":"ok"})));
	}
	else {
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":-1, "message":"variable inconnue"})));
	}
});    

// Deinh alarm
dispatcher.onPost("/api/tags.asmx/setDeInhibitAlarm", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text'});
	var payload = JSON.parse(req.body.replace(new RegExp("'", 'g'),"\""));
	var id = parseInt(payload.id);
	console.log("setDeinhAlarm","id",id);
	var tag = Tags.findById(id);
	if (tag != undefined) {
		if (tag.inh) {
			tag.inh = false;
			tag.dt = new Date().getTime();
			Tags.checkState(tag, true);
		}
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":0, "message":"ok"})));
	}
	else {
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":-1, "message":"variable inconnue"})));
	}
});    

// inh group alarm
dispatcher.onPost("/api/tags.asmx/setInhibitAlarmGroup", function(req, res) {
	var payload = JSON.parse(req.body.replace(new RegExp("'", 'g'),"\""));
	var id = payload.id;
	var group = Groups.findById(id);
	if (group != undefined) {
		Tags.forEach(function (tag) {
			if (tag.group.id == id) {
				if (!tag.inh) {
					tag.inh = true;
					tag.dt = new Date().getTime();
					Tags.checkState(tag, true);
				}
			}
		});
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":0, "message":"ok"})));
	}
	else {
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":-1, "message":"groupe inconnu"})));
	}
});    

// deinh group alarm
dispatcher.onPost("/api/tags.asmx/setDeInhibitAlarmGroup", function(req, res) {
	var payload = JSON.parse(req.body.replace(new RegExp("'", 'g'),"\""));
	var id = payload.id;
	var group = Groups.findById(id);
	if (group != undefined) {
		Tags.forEach(function (tag) {
			if (tag.group.id == id) {
				if (tag.inh) {
					tag.inh = false;
					tag.dt = new Date().getTime();
					Tags.checkState(tag, true);
				}
			}
		});
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":0, "message":"ok"})));
	}
	else {
		res.writeHead(200, {'Content-Type': 'application/xml'});
		res.end(addString(JSON.stringify({"code":-1, "message":"groupe inconnu"})));
	}
});    


// UserProfils    
dispatcher.onPost("/api/users.asmx/getUserProfilsList", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/xml'});
	fs.readFile(databasePath+"UserProfils.csv", function (error,data) {
		res.end(addString(JSON.stringify(csvToJson(data.toString()))));
	});
});    

// Groups    
dispatcher.onPost("/api/tags.asmx/getGroups", function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/xml'});
	res.end(addString(JSON.stringify(Groups.collection)));
});    

// hello    
dispatcher.onPost("/api/authentication.asmx/hello", function(req, res) {
	res.writeHead(200, {'Content-Type': 'application/xml'});
	fs.readFile(databasePath+"ClientStations.csv", function (error,data) {
		var clientIp = (simulClientIp != '?') ? simulClientIp : req.connection.remoteAddress;
		
		var clientStations = csvToJson(data.toString());
		for (var idx = 0; idx<clientStations.length; idx++) {
			var stations = clientStations[idx];
			//console.log("clientStations.stations="+stations.ipRange+" "+clientIp);
			var ok = checkIpRange(clientIp, stations.ipRange);
			if (ok) {
				if (stations.connexionAllowed.toLowerCase() != "true") {
					console.log('connexion',clientIp,stations.name,'refusée');
					res.end("<string xmlns=\"http://linaware.eu/\">"+JSON.stringify({"ipClient": clientIp, "authorized": "False"})+"</string>");
					return;
				}
				else {
					console.log('connexion',clientIp,stations.name,'acceptée');
					stations.clientIp = clientIp;
					stations.updatePeriod = stations.period;
					res.end("<string xmlns=\"http://linaware.eu/\">"+JSON.stringify(stations)+"</string>");
					return;
				}
			}
		}
		console.log('connexion',clientIp,'refusée');
		res.end("<string xmlns=\"http://linaware.eu/\">"+JSON.stringify({"ipClient": clientIp, "authorized": "False"})+"</string>");
	
	});
});    

// GetAllobjects    
dispatcher.onPost("/api/tags.asmx/getAllObjects", function(req, res) {
	var cols = req.body.split("=");
	var dtLastRequest = parseInt(cols[1]);
	var slist = [];
	for (idx in Tags.collection) {
		var tag = Tags.collection[idx];
		//console.log(tag.name ," ", tag.dt);
		if (tag.dt >= dtLastRequest) {
			var stag = {"dt":tag.dt.toString(), "ID": tag.id.toString(), "v": tag.value };
			if (tag.stateModelInstance) {
				stag.st = tag.stateIndex;
				stag.ack = tag.ack ? "1" : "0";
				stag.inh = tag.inh ? "1" : "0";
			}
			slist.push(stag);
		}
	}
	//console.log("getAllObjects",req.body,"nb",slist.length);
	var dtEvent = new Date().getTime();
    res.writeHead(200, {'Content-Type': 'application/xml'});
	res.end(addString(JSON.stringify( {"AllObjects": {"v":slist, "dtEvent": {"Date":dtEvent, "Ticks": dtEvent}}} )));
});    


checkIpRange= function(ip, ipRange) {
	var ranges = ipRange.split(';');
	for (var idxRange = 0; idxRange < ranges.length; idxRange++) {
		var range = ranges[idxRange];
		if (range === '*')
			return true;
		if (range.indexOf('-')>=0) {
			var addresses = range.split('-');
			var ip0 = addresses[0].split(".");
			var ip1 = addresses[1].split(".");
			var tip = ip.split(".");
			var ip0_3 = parseInt(ip0[3]);
			var ip1_3 = parseInt(ip1[3]);
			var ip_3 = parseInt(tip[3]);
			if ((tip[0] === ip0[0]) && (tip[1] === ip0[1]) && (tip[2] === ip0[2]) && (ip_3>=ip0_3) && (ip_3<=ip1_3)) {
				return true;
			}
		}
		else {
			if (ip === range) {
				return true;
			}
		}
	}
	return false;
}
	
csvToJson = function(csv) {
	var lines = csv.split('\r\n');
	var line0 = lines[0];
	var headers = line0.split('\t');
	var json = [];
	var id = 0;
	for (var idxLine = 1; idxLine < lines.length; idxLine++) {
		var line = lines[idxLine];
		if (line.trim() != "") {
			var row = {};
			var fields = line.split('\t');
			row["id"] = id;
			for(var idxCol = 0; idxCol < headers.length; idxCol++)
				row[headers[idxCol]] = fields[idxCol];
			json.push(row);
			id++;
		}
	}
	return json;
}
	
loadGroups = function() {
	fs.readFile(databasePath+"Groups.csv", function (error,data) {
		var list = csvToJson(data.toString());
		var id = 0;
		for(idx in list) {
			item = list[idx];
			item.id = id;
			Groups.add(item);
			id++;
			if (idx == list.length - 1) {
				console.log('Groups loaded');
				loadStateLevels();
			}
		};
	});
};    

loadStateLevels = function() {
	fs.readFile(databasePath+"StateLevels.csv", function (error,data) {
		var list = csvToJson(data.toString());
		var id = 0;
		for(idx in list) {
			item = list[idx];
			item.id = id;
			StateLevels.add(item);
			id++;
			if (idx == list.length - 1) {
				console.log('StateLevels loaded');
				loadStateModels();
			}
		};
	});
};    

loadStateModels = function() {
	fs.readFile(databasePath+"StateModels.csv", function (error,data) {
		var list = csvToJson(data.toString());
		var id = 0;
		for(idx in list) {
			item = list[idx];
			item.id = id;
			item.SM_SM_ID = id;
			StateModels.add(item);
			id++;
			if (idx == list.length - 1) {
				console.log('StateModels loaded');
				loadStates();
			}
			
		};
	});
};    

loadStates = function() {
	fs.readFile(databasePath+"States.csv", function (error,data) {
		var list = csvToJson(data.toString());
		var id = 0;
		for(idx in list) {
			item = list[idx];
			item.stateModelInstance = StateModels.find(item.stateModel);
			if (item.stateModelInstance != undefined) {
				item.ST_SM_ID = item.stateModelInstance.id;
			}
			else {
				console.log("State",item.stateModel,"modèle introuvable");
			}
			if (item.level != "") {
				item.stateLevelInstance = StateLevels.find(item.level);
				item.ST_SL_ID = item.stateLevelInstance.id;
			}
			else {
				item.stateLevelInstance = undefined;
			}
			item.id = id;
			item.ST_Index = item.stateIndex;
			item.ST_Color = item.color;
			States.add(item);
			id++;
			if (idx == list.length - 1) {
				console.log('States loaded');
				loadTags();
			}
		};
	});
};    

loadTags = function() {
	var files = ["TagsModbusTcp.csv","TagsModbusRtu.csv","TagsOpc.csv","TagsTwincat2.csv"];
	var id = 0;
	files.forEach(function(file) {
		fs.readFile(databasePath+file, function (error,data) {
			var list = csvToJson(data.toString());
			for(idx in list) {
				item = list[idx];
				item.states = [];
				if (item.stateModel != "") {
					item.stateModelInstance = StateModels.find(item.stateModel);
					if (id<50)
					for(idxState in States.collection) {
						var state = States.collection[idxState];
						//console.log(state.stateModel,item.stateModel,state.stateModel == item.stateModel);
						if (state.stateModel == item.stateModel) {
							item.states.push(state);
						}
					}
					//console.log("   ",item.name,item.states.length);
				}
				item.id = id;
				item.groupInstance = Groups.find(item.group);
				item.value = "0";
				item.dt = new Date().getTime();
				item.ack = true;
				item.inh = false;
				item.locked = false;
				Tags.add(item);
				id++;
				if (idx == list.length - 1) {
					console.log('Tags loaded');
					loadTagsValues();
				}
			};
		});
	});
};    

Tags.setValue = function(tag, value) {
	if (typeof(tag) == "string") {
		tag = Tags.find(tag);
	}
	else if (typeof(tag) == "object") {
	}
	if (tag != undefined) {
		console.log("setValue : ",tag.name,"=",value," (",tag.value,") dt=",tag.dt);
		tag.value = value;
		tag.dt = new Date().getTime();
		this.checkState(tag, true);
		saveTagsValues();
	}
	else {
		console.log("setValue : tag introuvable");
	}
}

Tags.checkAllStates = function () {
	Tags.collection.forEach(function(tag) {
		Tags.checkState(tag,false);
	});
}

Tags.checkState = function(tag, fire) {
	if (tag.stateModelInstance == undefined)
		return;
	if (tag.inh) {
		return;
	}
	
	for(idx in tag.states) {
		var state = tag.states[idx];
		var threshold = parseFloat(state.threshold);
		var value = parseFloat(tag.value);
		var ok = false;
		switch (state.operator) {
			case "=": ok = threshold == value;break;
			case "<": ok = value < threshold ;break;
			case "<=": ok = value <= threshold ;break;
			case ">": ok = value > threshold ;break;
			case ">=": ok = value >= threshold ;break;
			case "!=": ok = value != threshold ;break;
			case "<>": ok = value != threshold ;break;
		}
		//console.log(tag.name,ok,state.stateModel, state.stateIndex);
		if (ok) {
			tag.stateIndex = state.stateIndex;
			tag.stateLevel = state.stateLevel;
			if (state.stateLevelInstance != undefined) {
				tag.stateLevelIndex = state.stateLevelInstance.id;
			}
			
			if (fire) {
				console.log("tag",tag.name,"stateIndex",state.stateIndex);
				tag.dt = new Date().getTime();
				if (state.stateLevelInstance.ackNeeded == "true") {
					tag.ack = false;
				}
			}
			break;
		}
	}
}
	
saveTagsValues = function() {
	values = "name\tvalue\tdt\tack\tinh\tlocked\r\n";
	for(idx in Tags.collection) {
		var tag = Tags.collection[idx];
		if (tag.hasOwnProperty("value")) {
			if ((tag.value != "0") && (tag.value != 0)) {
				values = values.concat(tag.name,"\t",tag.value,"\t",tag.dt,"\t",tag.ack,"\t",tag.inh,"\t",tag.locked,"\r\n");
			}
		}
	}
	fs.writeFile(databasePath+"mockTagsValues.txt", values, function (error) {
		if (error)
			console.log("saveTagsValues:",error);
	});
}

loadTagsValues = function() {
	var file = databasePath+"mockTagsValues.txt";
	fs.readFile(file, function (error, data) {
		if (error) {
			console.log("mockTagsValues.txt not created yet ...");
		}
		else {
			var lines = data.toString().split('\r\n');
			var line0 = lines[0];
			var headers = line0.split('\t');
			var json = [];
			var id = 0;
			for (var idxLine = 1; idxLine < lines.length; idxLine++) {
				var line = lines[idxLine];
				if (line.trim() != "") {
					var cols = line.split('\t');
					var tagName = cols[0];
					var tag = Tags.find(tagName);
					if (tag != undefined) {
						if (cols.length>=2) {
							tag.value = cols[1];
						}
						if (cols.length>=3) {
							tag.dt = parseInt(cols[2]);
						}
						if (cols.length>=4) {
							tag.ack = cols[3] == "true";
						}
						if (cols.length>=5) {
							tag.inh = cols[4] == "true";
						}
						if (cols.length>=6) {
							tag.locked = cols[5] == "true";
						}

					}
				}
			}
		}
		console.log('Tags values loaded');
		Tags.checkAllStates();
		server.listen(PORT, function(){
			//Callback triggered when server is successfully listening. Hurray!
			console.log("Server listening on: http://localhost:%s", PORT);
		});
	});
};

loadGroups();
//loadStateLevels();
//loadStateModels();
//loadStates();
//loadTags();
//loadTagsValues();

