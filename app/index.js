let on = require('./../superon')

let app = {
	store:   { get: (i) => i, set: (i) => i }, 
    start:   ( ) => setInterval( () => true, 1000), 
    stop:    ( ) => process.exit(), 
	pub:     (i) => i, 
	arr2ascii: require('console.table').getTable
}

on(app)
app.pub.on( (i) => (i) ) // turn on channel 


// load features
if( on.server ){ 
    //require('./plugin/stdout')(app)
    //require('./plugin/stderr')(app)
    require('./plugin/http')(app)
    require('./plugin/rshell')(app)
	setInterval( () => console.log( new Date().getTime() ), 4000)
}

on('*',  (i, o) => {
	if( typeof o.output == 'object' && o.output.slice ) o.output = app.arr2ascii(o.output)
})

//app.on('remoteshell.repl.format', 'arr2ascii' )
//
//console.log("todo: webhook mapping plugin")
//
//// redirect stdout to remoteshell
//
//app.on('remoteshell.http.io', function redirectTTY(io, input){
//    var hook = app.on('stdout.io:input', (input) => input.res.write(input) )
//    app.on('remoteshell.http.close',  hook.remove )
//    return io(input)
//})

module.exports = app
