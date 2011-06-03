var http = require("http"),
	url = require("url"),
	qs = require('querystring');

function start(route, url_map, port) {
	http.createServer(function(request, response) {
		var url_obj = url.parse(request.url,true),
			pathname = url_obj.pathname,
			handler,body;
		console.log("Request for " + pathname + " received.");
		handler = route(url_map, pathname);
		if(handler){
			request.GET = url_obj.query;
			if(request.method === 'POST'){
				body = '';
				request.on('data', function(data){body += data;});
				request.on('end', function () {
					request.POST = qs.parse(body);
					handler(request,response);
				});
			}else{
				request.POST = {};
				handler(request,response);
			}
		}else{
			url_map['#404'](request,response);
		}
	}).listen(+port);
	console.log("Server has started.");
}

exports.start = start;
