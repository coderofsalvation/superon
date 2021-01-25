let test = require('./test')
let on   = require('./../superon')
var t    = new test({title:__filename})
var jsonLogic = require('json-logic-js')
var filtrex  = require('filtrex').compileExpression
// https://www.npmjs.com/package/safe-evaluate-expression

let compare = (a, b) => JSON.stringify(a) == JSON.stringify(b)
let testlog  = ""

// lets immediately use superon for own tests :)
on(console)
console.on('log:input', function(msg){
	testlog += msg+"\n"
})

t.add("test unnested",  async (next, error) => {
	// testdummies
	var input  = {x:1}
	var log    = "" 
	this.foo         = function(i){ log+=i.x+"foo"; return i; }

	on(this)
	this.on('foo', (foo, input) => {
		input.x += 2	
		return foo(input)
	})
	let out = this.foo(input)
	if( !compare(out, {x:3}) || log != "3foo" )
		return error("not ok:"+log+out)

	this.on.remove()
	out = this.foo({x:1})
	if( !compare(out, {x:1}) ) error('not removed')

	next()
})

t.add("test nested",  async (next, error) => {
	// testdummies
	var input  = {x:1}
	var log    = "" 
	this.foo         = function(i){ log+=i.x+"foo"; return i; }
	this.foo.bar     = (i) =>     { log+=i.x+"bar"; return i; }
	this.foo.bar.baz = function(i){ log+=i.x+"baz"; return i; }

	on(this)
	this.on('foo.bar.baz', (foo, input) => {
		input.x += 5	
		return foo(input)
	})
	let out = this.foo.bar.baz(input)

	if( !compare(out, {x:6}) || log != "6baz" )
		return error("not ok:"+log+out)

	this.on.remove()

	next()
})

t.add("test nested filtrex rule",  async (next, error) => {

	// testdummies
	var input  = {x:1}
	testlog    = "" 

	this.set('foo.bar.baz'  , function(i){ return i; } )
	this.set('haspaid'      , (i) => true              )

	let dofiltrex = (input, rule) => filtrex(rule.when, {extraFunctions:this} )(input)

	on(this)

	this
	.on('foo.bar.baz', (foo, input) => {
		input.x += 5	
		return foo(input)
	})
	.when('x == 1 and haspaid()', dofiltrex ) // string could originate from db
		
	let out = this.foo.bar.baz(input)
	if( input.x !=6 ) return error("x is not mutated to 6")
	out = this.foo.bar.baz(input)
	if( input.x !=6 ) return error("x is mutated to >6")

	this.on.remove()

	next()
})

t.add("test input clone",  async (next, error) => {
	// testdummies
	var input  = {x:1}
	var log    = "" 
	this.foo         = function(i){ log+=i.x+"foo"; return i; }
	this.foo.bar     = (i) =>     { log+=i.x+"bar"; return i; }
	this.foo.bar.baz = function(i){ log+=i.x+"baz"; return i; }

	on(this)
	this.on('foo.bar.baz:input', (input) => {
		input.x += 5	
		log += "clone"+input.x+","
	})
	let out = this.foo.bar.baz(input)
	if( log != "clone6,1baz" ) return error("something wrongg: "+log)
	
	this.on.remove()

	next()
})

t.add("test input clone multiple",  async (next, error) => {
	// testdummies
	var input  = {x:1}
	var log    = "" 
	this.foo         = function(i){ log+=i.x+"foo"; return i; }
	this.foo.bar     = (i) =>     { log+=i.x+"bar"; return i; }
	this.foo.bar.baz = function(i){ log+=i.x+"baz"; return i; }

	on(this)
	this.on('foo.bar.baz:input', (input) => {
		input.x += 5	
		log += "clone"+input.x+","
	},  this.foo.bar)
	let out = this.foo.bar.baz(input)
	if( log != "clone6,6bar1baz" ) return error("something wrongg: "+log)
	
	this.on.remove()

	next()
})

t.add("test output clone",  async (next, error) => {
	// testdummies
	var input  = {x:1}
	var log    = "" 
	this.foo         = function(i){ log+=i.x+"foo"; return i;     }
	this.foo.bar     = (i) =>     { log+=i.x+"bar"; return i;     }
	this.foo.bar.baz = function(i){ log+=i.x+"baz"; return {y:5}; }

	on(this)
	this.on('foo.bar.baz:output', (input) => {
		log += "clone"+input.y
	})
	let out = this.foo.bar.baz(input)
	if( log != "1bazclone5" ) return error("something wrong: "+log)
	
	this.on.remove()

	next()
})

t.add("test output multiple",  async (next, error) => {
	// testdummies
	var input  = {x:1}
	var log    = "" 
	this.foo         = function(i){ log+=i.x+"foo"; return i;     }
	this.foo.bar     = (i) =>     { log+=i.x+i.y+"bar"; return i;     }
	this.foo.bar.baz = function(i){ log+=i.x+"baz"; return {y:5, x:i.x}; }

	on(this)
	this.on('foo.bar.baz:output', (input) => {
		log += "clone"+input.y
		input.y += 1
	},  this.foo.bar )
	let out = this.foo.bar.baz(input)
	if( log != "1bazclone57bar" ) return error("something wrong: "+log)
	
	this.on.remove()

	next()
})

t.add("test superon in my superon",  async (next, error) => {
	// testdummies
	var input  = {x:1}
	var log    = "" 
	this.foo         = function(i){ log+=i.x+"foo"; return i;     }

	on(this)
	this.on('on:input', function(on){
		log += "onon"
	})
	this.on('foo:output', (input) => {
		log += "clone"+input.x
	})
	let out = this.foo(input)
	if( log != "onon1fooclone1" ) return error("something wrong: "+log)

	this.on.remove()

	next()
})

t.add("test import expression rules from db",  async (next, error) => {
	// testdummies
	var input  = {type:"product", price:2}
	testlog    = "" 

    on(this)
	// set() is basically this.foo.bar.flop = ... without crashing (mkdir -p style)

	this.set('email.send'       , (input)       => console.log("    | sending email!")                   )
	this.set('db.create'        , (input)       => { input.id = 123; this.db.create.succes(input) })
	this.set('db.create.succes' , (input)       => console.log("    | db item created! "            )    )
    this.set('foo.bar.flop',  1)

    // we use filtrex,  but you can include your own expression engine here (json-logic-js for form generation e.g.)
	let dofiltrex = (input, rule) => filtrex(rule.when, {extraFunctions:this})(input)

	let db = [{	
		id:   "2k2lk34", 
	    on:   "db.create.succes:input", 
		when: "id > 0", 
		then: [ {f:"email.send", opts:{to:"john"}}, {f:"flop"}  ]
	}]

	this.on.load(db, dofiltrex )

    /*
    this.on('email.send:output', function logemail(){
       console.log("logemail") 
    })
    .when('foo > 2')
    
    this.on('email.send:output', function foolkasdjkf(){
       console.log("logemail2") 
    })
    */

	let out = this.db.create(input)
	if( !testlog.match(/created/) || !testlog.match(/email/) )
	    return error("wrong: "+testlog)

	var dump = this.on.serialize()
	console.log("dump")
	this.on.ls()

	next()
})

t.add("test import expression rules from db 2",  async (next, error) => {
	// testdummies
	var input  = {type:"product", price:2}
	testlog    = "" 

    on(this)
	// set() is basically this.foo.bar.flop = ... without crashing (mkdir -p style)

	this.set('email.send'       , (input)       => console.log("    | sending email!")                   )
	this.set('db.create'        , (input)       => { input.id = 123; this.db.create.succes(input) })
	this.set('db.create.succes' , (input)       => console.log("    | db item created! "            )    )
    this.set('foo.bar.flop',  1)

    // we use filtrex,  but you can include your own expression engine here (json-logic-js for form generation e.g.)
	let dofiltrex = (input, rule) => filtrex(rule.when, {extraFunctions:this})(input)

	let db = [{	
		id:   "2k2lk34", 
	    on:   "db.create.succes:input", 
		when: "id > 0", 
		then: [ {f:"email.send", opts:{to:"john"}}, {f:"flop"}  ]
	}]

	this.on.load(db, dofiltrex )

    this.on('email.send:output', function logemail(){
       console.log("logemail") 
    })
    .when('foo > 2')
    
    this.on('email.send:output', function foolkasdjkf(){
       console.log("logemail2") 
    })

    this.on.error = (msg) => console.log("errorrr")

	let out = this.db.create(input)
	if( !testlog.match(/created/) || !testlog.match(/email/) || !testlog.match(/errorrr/) )
	    return error("wrong: "+testlog)

	var dump = this.on.serialize()
	this.on.ls()
    console.log( this.on.dot() )

	next()
})

t.run( () => console.log("done") )