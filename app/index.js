const on  = require('./../superon')
const app = {
    io:      (i) => i, 
    start:   ( ) => setInterval( () => true, 1000), 
    stop:    ( ) => process.exit()
}

on(app)

// load features
if( on.server ){ 
    require('./plugin/remoteshell')(app)
    require('./plugin/stdout')(app)
    require('./plugin/stderr')(app)
}

setInterval( () => console.log( new Date().getTime() ), 2000)

app.ls = function(){
    return "1\n2\n3\n";
}

app.on('remoteshell.repl.io', function exeCMD(io,req){
    if( !req.cmd ) return io(req)
    var f = app.get( req.cmd.trim() )
    if( f ) req.output = f() 
    io(req)
})

app.on('remoteshell.http.io', function redirectTTY(io, req, res){
    var hook = app.on('stdout.io', (io, output) => {
        res.write(output) 
        return io(output)
    })
    app.on('remoteshell.http.io.close',  hook)
    return io(req, res)
})

app.on.ls()

app.on('start', app.remoteshell.start )

app.start()
