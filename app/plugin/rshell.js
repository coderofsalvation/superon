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
|__ --|  |  |  _  |  -__|   _|  _  |     |
|_____|_____|   __|_____|__| |_____|__|__|
            |__|                          

`

    let rshell

	rshell = {
		welcome,
        prompt:   'superon $ ', 
        userpass: 'admin:admin',  
		port:     8000, 
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
			res.setHeader('content-type', 'multipart/octet-stream')
			res.write( app.rshell.welcome )
			repl.start({
			  prompt: rshell.prompt, 
			  input: req, 
			  output: res, 
			  terminal: false, 
			  useColors: true, 
			  useGlobal: false, 
			  writer: app.rshell.format, 
			  eval: (cmd, context, file, cb) => app.pub({cmd, ctx:()=>ctx, file, cb, req:()=>req, res:()=>res, port, plugin:"rshell"})
			})

			// log
			console.log(req.headers['user-agent'])

			// hack to thread stdin and stdout
			// simultaneously in curl's single thread
			var iv = setInterval(function () {
			  if( enabled ) res.write(buf0)
			}, 100)

			let hook = rshell.stop.on( (o) => {
				res.write("connection closing\n")
				res.end()
			})

			res.connection.on('end', function () {
			  console.log("STOPPEN!")
			  clearInterval(iv)
			  app.rshell.stop()
			  hook.remove()
			})

		}, 
		close: (i) => i, 
		auth:  (i) => {
			let port = i.port
			let req  = i.req()
			let res  = i.res()
			var userpass = new Buffer((req.headers.authorization || '').split(' ')[1] || '',  'base64').toString();
			if (app.rshell.userpass && userpass !== app.rshell.userpass) {
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
		req: (i) => enabled && i.plugin == 'http' && i.port == rshell.port, 
		res: (i) => enabled && i.plugin == 'rshell' && i.output
	}

	on( '*', (i, o) => {
		if( is.req(o) ) rshell.input(o)
		if( is.res(o) ) o.cb(null, o.output)
	})

}
