process.on('uncaughtException', function(err){
	if(err.response){
		err.response.writeHead(500,err.message,{'Content-Type':'text/html'});
		response.write('<html><head><title>500 - Internal Server Error</title></head><body>'+err.message+'</body></html>');
		response.end();
	}else{
		console.log("Uncaught Exception: ", err.message);
		console.log(err.stack);
	}
});
require("./e/url_config").get_urls(process.argv[2],function(path_map){
	console.log(path_map);
	require("./e/server").start(require("./e/router").route, path_map, process.argv[3] || process.argv[2] || 80);
});
