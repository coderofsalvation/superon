let app = require('./../app')
let on  = require('./../superon')

app.date  = () => (new Date()).toISOString()
                              .replace(/T/, ' ')
                              .replace(/\..*/, '')
                              .replace(/[0-9][0-9][0-9][0-9]-/,'')
app.rules = function(){
    return [
		{when:"price > 10", then:"email", data:{"to":"john@gmail.com"} }, 
		{when:"price > 20", then:"email", data:{"to":"sara@gmail.com"} }, 
	]
}

let clientToggle = function(type, cache, i){
    let id     = i.req().socket.remotePort
    let client = app.rshell.clients[id] 
    client[type] = !client[type]
    if( !cache.inited ){
        on('*', (i, o, e) => {
            if( i.plugin == type && !i.seen ) 
               for ( var j in app.rshell.clients )
                    if( app.rshell.clients[j][type] )
                       app.rshell.clients[j].res().write(app.date()+' '+i.output)
            i.seen = true
        })
        cache.inited = true
    }
    return type+" "+(client[type] ? "enabled" : "disabled")
}

app.stdout = clientToggle.bind(this, "stdout", {})
app.stderr = clientToggle.bind(this, "stderr", {})

app.ls = app.help = function(){
    return "rules\nstdout\nstderr"
}

let exeCMD = (i, o) => {
	let {cmd} = i 
    var f = app[ cmd.trim() ]
	delete o.cmd
    o.output =  f ? f(i) : " "
	app.msg(o)
}

on('*',  (i, o) => {
	if( i.cmd   ) exeCMD(i, o)
	if( i.error ) console.error(i)
})

app.msg({foo:123})

console.log("todo: stateful events / cache / brain?")

app.rshell.start()

app.start()

