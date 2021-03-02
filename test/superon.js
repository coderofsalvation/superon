let test = require('./test')
let on   = require('./../superon')
let pipe = on.pipe
var t    = new test({title:__filename})
var filtrex  = require('filtrex').compileExpression
// https://www.npmjs.com/package/safe-evaluate-expression

let compare = (a, b) => JSON.stringify(a) == JSON.stringify(b)

let mock = () => ({
	foo: {
		bar: (i) => ({...i, bar:1})
	}
})

t.add('test handlers', (next,error) => {
	let plug = mock()
	let clone

	on(plug)                                        // init
	plug.foo.bar.on( (i) => i.a = 1               ) // add input handler 
	plug.foo.bar.on( (o) => clone = o.clone()     ) // add output handler 
	plug.foo.bar.on( (o) => ({...o,b:1})          ) // add output handler 
	plug.foo.bar.on( (o) => ({...o,c:1})          ) // add output handler 

	let out = plug.foo.bar({x:1})
	if( !compare({x:1,a:1,b:1,c:1}, out) ) return error("output not ok")
	if( !compare({x:1,a:1},       clone) ) return error("clone not ok")
	next()
})

t.add('test remove handlers', (next,error) => {
	let plug = mock()
	let clone

	on(plug)                                        // init
	plug.foo.bar.on( (i) => i.a = 1               ) // add input handler 
	plug.foo.bar.on( (o) => clone = o.clone()     ) // add output handler 
	plug.foo.bar.on( (o) => ({...o,b:1})          ) // add output handler 
	plug.foo.bar.on( (o) => ({...o,c:1})          ) // add output handler 

	// remove single
	plug.foo.bar.on.remove()
	let out = plug.foo.bar({x:1})
	if( out.c ) return error("c should not be there")

	//remove all
	on.remove(plug)
	out = plug.foo.bar({x:1})
	if( !compare({x:1,bar:1},out) ) return error("handlers not removed")
	next()
})

t.add('test bus / middleware', (next,error) => {
	let plug = mock()
	let called = false

	on(plug)                                        // init

	on( '*', (i,o) => {
		if( i && o ) called = true
	})
	
	plug.foo.bar.on( (i) => i.a = 1               ) // add at least one handler

	let out = plug.foo.bar({x:1})

	if( !called ) return error("not called :(")

	next()
})

t.add('test throw error', (next,error) => {
	let plug = mock()
	let called = false

	on(plug)                                 // init

	plug.on.error = () => called = true

    plug.foo.bar.on( (i) => { throw "BAM!"} ) // add at least one handler

    try {
        let out = plug.foo.bar({x:1})
    }catch(e){ called = true }

	if( !called ) return error("not called :(")

	next()
})

t.add('test pipe', (next,error) => {
	let plug = mock()
	let called = false

	on(plug)                                 // init

	on( '*', (i,o) => {
		if( o.error ) called = true
	})

	let a = (i) => ({...i, a:1})
	let b = (i) => ({...i, b:1}) 
	let c = (i) => ({...i, c:1}) 

	plug.foo.bar.on([
		a, 
		b, 
		c
	])

	let out = plug.foo.bar({x:1})

	if( !out.a || !out.b || !out.c ) return error("not piped :(")

	next()
})

t.add('business rule engine', (next,error) => {
    let emailsent = false
	let plug = mock()
	let databaseRules = () => [
		{expr:"price > 1", exprtype:"filtrex", action:"send email", config:{to:"me@foo"}}
	]

	on(plug)                                 // init


	let exprtype = {filtrex: (i, expr) => filtrex(expr)(i) }
	let actions  = {"send email": (i)  => emailsent = i.to }

	on( '*', (i,o) => {
		databaseRules().map( (r) => { 
			if( exprtype[r.exprtype](i, r.expr) ){
				actions[ r.action ]( Object.assign(o,r.config) )
			}	
		})
	})

	plug.foo.bar.on( (o) => o ) // add listener 

	plug.foo.bar({plugin:'db',op:'create',table:'product',price:10})	

	// output: sending mail: {"plugin":"db", "op":"create", "table":"product", "price":10, "bar":1, "to":"me@foo"}

	next()
})

t.run()
