let on = require('./../superon')

let app = {
	store:   { get: (i) => i, set: (i) => i }, 
    start:   ( ) => setInterval( () => true, 1000), 
    stop:    ( ) => process.exit(), 
	arr2ascii: require('console.table').getTable
}

on(app,  (i, o, e) => {
    // global bus
})

// load features
if( on.server ){ 
    require('./plugin/stdout')(app)
    require('./plugin/stderr')(app)
    require('./plugin/http')(app)
    require('./plugin/rshell')(app)
	setInterval( () => {
        console.log( new Date().getTime() )
        console.error("some error")
    }, 4000)
}

// convert rshell array-output to ascii-table
app.rshell.format.on( (o) => typeof o == 'object' && o.slice ? app.arr2ascii(o) : o )

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
