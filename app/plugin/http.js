module.exports = (app, opts) => {

    let http = require('http')
	let services = []

    app.http = {

		start: (port) => {
			console.log(`[on] http `+port)

			if( services[port] ) return console.log("http already running at "+port)

			var server = services[port] = http.createServer( (req, res) => {
				app.msg({req: ()=>req, res:()=>res, port,plugin:"http"})
			})
			server.listen(port)
			return server
		}, 

		stop: (port) => {
			console.log(`[off] http `+port)
			let server = services[port]
			if( server ){
				services[port].close()
				delete services[port]
			}
			return server
		}
	}

}
