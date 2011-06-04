var path = require("path"),
	fs = require('fs'),
	type_map = {
		s:function(s){return s;},
		d:function(s){return +parseInt(s,10);}
	};

function get_static(request,response,base,addition,err_map){
	fs.stat(base,function(err,s){
		var filename;
		if(err){
			console.log(err);
			err_map['#404'](request,response,err); 
			return;  
		}
		filename = s.isDirectory()?path.join(base, addition):base;
		console.log("Static request for "+filename);
		fs.readFile(filename, "binary", function(err, file){  
			if(err){
				console.log(err);
				err_map['#500'](request,response,err); 
				return;  
			}
			response.writeHead(200);
			response.write(file, "binary");  
			response.end();  
		});
	});
}

function route(url_map, pathname) {
	var handler=url_map,
		dirs = pathname.split('/'),
		argtypes,
		i;
	if(dirs[dirs.length-1]===''){dirs.pop();}
	for(i=1;i<dirs.length && handler.hasOwnProperty(dirs[i]);i++) {
		handler = handler[dirs[i]];
	}
	argtypes = handler['#args'];
	handler = handler['/'] || null;
	if(handler){
		dirs = dirs.slice(i);
		if(typeof handler !== 'function'){
			return function(request,response){get_static(request,response,handler,dirs.join("/"),url_map);}
		}
		if(typeof argtypes !== 'undefined'){
			i=argtypes.length;
			if(dirs.length===i){
				while(--i >= 0){dirs[i] = type_map[(argtypes[i] || 's')](dirs[i]);}
				return	dirs.length?
						function(request,response){handler.apply(null,[request,response].concat(dirs));}:
						handler;
			}
		}else{
			return function(request,response){handler(request,response,dirs);};
		}
	}
	return null;
}

exports.route = route;
