/**
 * Requires node v0.7.7 or greater.
 *
 * To connect: $ curl -sSNT. localhost:8000 -u admin
 */

module.exports = (app, opts) => {
    var http = require('http')
      , repl = require('repl')
      , buf0 = Buffer.from([0])

    let stdout = true
    let server
    let enabled = false

    let remoteshell = {
        prompt:   'superon $ ', 
        welcome:  '\nwelcome \\o/\n\n', 
        userpass: 'admin:admin',  
        auth:     (req) => true, 
        start:    () => {
            console.log("[] remoteshell")
            enabled = true
            server = http.createServer( app.remoteshell.http.io )
            server.listen(8000)
        }, 
        stop: () => {
            console.log("[ ] remoteshell")
            server.close() 
            enabled = false
        }, 
        repl:{
            io:     (i)   => i.cb(null, i.output || "" ), 
            stdout: ()    => stdout = !stdout, 
            format: (out) => {
                return out
                if( typeof out == "string" ) return out
                if( typeof out == "object" ) return JSON.stringify(out, null,  2)
            }
        }, 
        http:{

            io:    (req, res) => {
                res.setHeader('content-type', 'multipart/octet-stream')
                res.write( app.remoteshell.welcome )
                repl.start({
                  prompt: app.remoteshell.prompt, 
                  input: req, 
                  output: res, 
                  terminal: false, 
                  useColors: true, 
                  useGlobal: false, 
                  writer: app.remoteshell.repl.format, 
                  eval: (cmd, context, file, cb) => app.remoteshell.repl.io({cmd, context, file, cb})
                })

                // log
                console.log(req.headers['user-agent'])

                // hack to thread stdin and stdout
                // simultaneously in curl's single thread
                var iv = setInterval(function () {
                  if( enabled ) res.write(buf0)
                }, 100)

                app.on('remoteshell.stop:output', () => {
                    res.write("connection closing\n")
                    res.end()
                })

                res.connection.on('end', function () {
                  clearInterval(iv)
                  app.remoteshell.http.close()
                })
            }, 
            close: (i) => i, 
            auth:  (io, req, res) => {
                var userpass = new Buffer((req.headers.authorization || '').split(' ')[1] || '',  'base64').toString();
                if (app.remoteshell.userpass && userpass !== app.remoteshell.userpass) {
                    res.writeHead(401,  { 'WWW-Authenticate': 'Basic realm="nope"' });
                    res.end('HTTP Error 401 Unauthorized: Access is denied');
                    return;
                }
                io(req, res)
            }
        }
    }

    app.remoteshell = remoteshell

    app.on('remoteshell.http.io', app.remoteshell.http.auth )
    app.on('remoteshell.repl.io:input', (data) => app.io({plugin:"remoteshell",data}) )

}
