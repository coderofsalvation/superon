let app = require('./../app')
let on  = require('./../superon')

app.rules = function(){
    return [
		{when:"price > 10", then:"email", data:{"to":"john@gmail.com"} }, 
		{when:"price > 20", then:"email", data:{"to":"sara@gmail.com"} }, 
	]
}

app.ls = app.help = function(){
    return "rules"
}

let exeCMD = (i, o) => {
	let {cmd} = i 
    var f = app[ cmd.trim() ]
	delete o.cmd
    o.output =  f ? f() : ""
	app.pub(o)
}

on('*',  (i, o) => {
	if( i.cmd   ) exeCMD(i, o)
	if( i.error ) console.error(i)
})

app.pub({foo:123})

console.log("todo: stateful events / cache / brain?")

app.rshell.start()

//app.on.ls()
app.start()

