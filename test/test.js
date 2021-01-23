function test(opts){
	this.node   = typeof process != undefined && typeof process != "undefined"
	this.tests  = this.tests || []
	this.errors = 0
	this.error  = (msg) => { this.errors += 1; console.error(msg); this.done(); process.exit(1) }
	this.add    = (description, cb) => this.tests.push({ description, cb })
	this.done   = (ready) => { console.log("\n> tests : "+this.tests.length+"\n> errors: "+this.errors); if( this.node ) process.exit( this.errors == 0 ? 0 : 1); ready(this) }
	this.run    = (ready) => {
		if( opts.title ) console.log(`\n${opts.title.replace( __dirname,"")}\n |`)
		var p = Promise.resolve()
		var runTest = (i) => {
			return new Promise( (resolve, reject) => {
				var test = this.tests[i]
				if( !test ) return this.done(ready)
				console.log(" "+test.description)
				var onError = (err) => { this.error(err); this.done(ready) }
				var _next   = () => { console.log(" ✓"); p.then(runTest(i+1)) }
				try { test.cb(_next, onError ) } catch (e) { onError(e) }
			})
		}
		p.then( runTest(0) )
	}
	return this
}

module.exports = test
