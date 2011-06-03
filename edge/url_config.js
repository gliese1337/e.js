var fs = require('fs'),
	controllers = {};

function get_controller(f_path){
	var i,
		f = controllers[f_path[0]] ||
		(controllers[f_path[0]]=require('../'+f_path[0]));
	for(i=1;i<f_path.length;i++){f = f[f_path[i]];}
	return f;
}

function make_map(line){
	var f_name=line[1];
	if(f_name.search(/^[.\/~]/)!==-1){return {'/':f_name};}
	f_map = {'/':get_controller(f_name.split('.'))};
	if(line[2]===':'){f_map['#args'] = line.slice(3);}
	return f_map;
}

function read_url_config(type,callback){
	if(typeof(type) === 'function'){
		callback = type;
		type = 'config';
	}
	var route_table;
	function ret(){
		//defaults
		route_table['#404'] || (route_table['#404'] = err404);
		route_table['#500'] || (route_table['#500'] = err500);
		//unwind the call stack
		process.nextTick(callback.bind(null,route_table));
	}
	fs.readFile.apply(fs,
		(type==='json')?
		['./urls.json', function(err, data){
			if(err){
				console.log("Error reading routing file: " +err);
				return;
			}
			route_table = JSON.parse(data,
				function(key,val){
					return ((key === '/' ||
							(key.charAt(0) === '#' && typeof(val) === 'string')
							) && val.search(/^[.\/~]/)===-1
						)?get_controller(val.split('.')):val;
				}
			);
			ret();
		}]:['./urls.config', function(err, data){
			var lines,line,record,dir_name,
				nws = /\S/,ws = /\s+/,
				obj_list,f_map,i,len,end=0;
			if(err){
				console.log("Error reading routing file: " +err);
				return;
			}
			data = (""+data).split('\n');
			lines = data.filter(function(str){return nws.test(str) && str.charAt(0)!=='#';});
			line = lines[0].split(ws);
			if(line[0]!==''){line.unshift('');}
			route_table = f_map = make_map(line);
			obj_list = [['',f_map]];
			for(i=1;i<lines.length;i++){
				line = lines[i];
				len=line.search(nws);
				if(len>end){len = end;}
				else while(len<end){
					record = obj_list[end--];
					obj_list[end][1][record[0]] = record[1];
				}
				line = lines[i].split(ws);
				if(line[0]===''){line.shift();}
				dir_name = line[0];
				f_map = line[1]?make_map(line):{};
				obj_list[++end] = [dir_name,f_map];
			}
			while(end){
				record = obj_list[end--];
				obj_list[end][1][record[0]] = record[1];
			}

			lines = data.filter(function(str){return str.charAt(0)==='#';});
			for(i=0;i<lines.length;i++){
				line = lines[i].split(ws);
				if(line[0]===''){line.shift();}
				dir_name=line[0];
				route_table[dir_name] = get_controller(line[1].split('.'));
			}
			ret();
		}]
	);
}

function err404(request,response,err){
	console.log("Default request handler #404 was called.");
	response.writeHead(404, "Not Found", {'Content-Type': 'text/html'});
	response.write('<html><head><title>404 - Resource Not Found</title></head><body><h1>The requested resource '+request.url+' does not exist.</h1></body></html>');
	response.end();
}
function err500(request,response,err){
	console.log("Default request handler #500 was called.");
	response.writeHead(500, "Internal Error", {'Content-Type': 'text/html'});
	response.write('<html><head><title>500 - Internal Server Error</title></head><body><h1>'+err+'</h1></body></html>');
	response.end();
}

exports.get_urls = read_url_config;
