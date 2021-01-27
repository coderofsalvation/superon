/**
 * Requires node v0.7.7 or greater.
 *
 * To connect: $ curl -sSNT. localhost:8000 -u admin
 */

module.exports = (app, opts) => {
	let on   = require('./../../superon')
    var repl = require('repl')
      , buf0 = Buffer.from([0])

    let stdout = true
    let server
    let enabled = false

    let welcome = `
.-----.--.--.-----.-----.----.-----.-----.
|__ --|  |  |  =__|  -__|   _|  _  |     |
|_____|_____|___| |_____|__| |_____|__|__|
                                      

`

    let rshell

	rshell = {
		welcome,
        prompt:   'superon $ ', 
        userpass: ['admin:admin', 'john:doe'],  
		port:     8000, 
        clients:  {}, 
        start:    () => {
			rshell.stop()
            console.log("[v] rshell started on port "+rshell.port)
			console.log("[ ] connect run: $ curl -sSNT. localhost:8000 -u admin")
            enabled = true
			return app.http.start( rshell.port )
        }, 
        stop: () => {
            console.log("[ ] rshell")
			app.http.stop( rshell.port )
        }, 
		format: (out) => out, 
		input: (input) => {
			let {req, res, port} = input
			req = req()
			res = res()
            rshell.clients[req.socket.remotePort] = input 
			res.setHeader('content-type', 'multipart/octet-stream')
			res.write( rshell.welcome )
			repl.start({
			  prompt: rshell.prompt, 
			  input: req, 
			  output: res, 
			  terminal: false, 
			  useColors: true, 
			  useGlobal: false, 
			  writer: rshell.format, 
			  eval: (cmd, context, file, cb) => app.msg({cmd, ctx:()=>ctx, file, cb, req:()=>req, res:()=>res, port, plugin:"rshell"})
			})

			// log
			console.log(req.headers['user-agent'])

			// hack to thread stdin and stdout
			// simultaneously in curl's single thread
			var iv = setInterval(function () {
			  if( enabled ) res.write(buf0)
			}, 100)

			res.connection.on('end', function (iv, input) {
              let id = input.req().socket.remotePort
              delete rshell.clients[id]
			  console.log("connection "+id+" ended")
			  clearInterval(iv)
			}.bind(this,iv,input))

		}, 
		close: (i) => i, 
		auth:  (i) => {
			let port = i.port
			let req  = i.req()
			let res  = i.res()
			var userpass = new Buffer((req.headers.authorization || '').split(' ')[1] || '',  'base64').toString();
			if (rshell.userpass && !rshell.userpass.includes(userpass) ) {
				res.writeHead(401,  { 'WWW-Authenticate': 'Basic realm="nope"' });
				res.end('HTTP Error 401 Unauthorized: Access is denied');
				return app.pub({plugin:'rshell', error: 'unauthorized rshell'});
			}
		}
    }

    app.rshell = rshell
	on(rshell)

	rshell.input.on( rshell.auth )
		
	let is = {
		req:    (i) => enabled && i.plugin == 'http' && i.port == rshell.port, 
		res:    (i) => enabled && i.plugin == 'rshell' && i.output
	}

	on( '*', (i, o) => {
		if( is.req(o)     ) rshell.input(o)
		if( is.res(o)     ) o.cb(null, o.output)
	})

    console.log("todo: global array of clients,  usable by all plugins")

}
