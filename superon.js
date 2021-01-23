function on(obj){
	
	let load = function(i,when){
		let add = (rule) => {
		  let cb = function(rule, input){
              if( when(input,rule) ) rule.then.map( (t) => this.get(t.f)(input, t.opts) )
          }.bind(this, rule)
		  cb.rule = rule 
		  this.on( rule.on, cb )
		}
		if( typeof i == 'object' && !i.slice ) add(i)
		else i.map( add )
	}

	let serialize = function(){
		return this.rules
	}

	let remove = function(){
		if( !this.rules ) return
		this.rules = this.rules.filter( (o) => o.remove() )
		this.rules = []
	}

	let _ = (o, opts) => {
	  o = o || {}
	  opts = opts || []
	  if( o.on ) return o // already done
	  for( var i in _ ) o[i] = _[i].bind( o )
	  o.on.load = load.bind(o)
	  o.on.serialize = serialize.bind(o)
	  o.on.remove = remove.bind(o)
	  return o
	}

	_.ls = function(){
		console.table(
			this.rules.map( (rule) => {
				r = Object.assign({},rule)
				r.on = r.on+r.type
				delete r.remove
				delete r.type
				//r.then = rule.then 
				return r
			})
		)
	}
		
	_.undo = function(){ 
		for ( var i in _ ) delete this[i]
		return this
	}
	_.export    = () => {foo:1}
	_.exportdot = () => "f -> a" 

	_.clone = function(keeprefs){
		return _( keeprefs ? Object.assign({},this) : JSON.parse( JSON.stringify(this) ) )
	}

	_.on   = function(){
		let args   = Array.prototype.slice.apply(arguments)
		let fn     = String(args[0]).replace(/:.*/, '').split(" ")[0]
		this.rules   = this.rules || []
		var me   = this
		var orig = this.get(fn)
		var is_async = (f) => _.get(f, 'constructor.name') == 'AsyncFunction'
		var clone = (args) => args.map( (a) => typeof a == 'object' ? _(a).clone(true) : a )
		var rule = {}
		var thens   = args.slice(1)
		rule.id     = String(new Date().getTime()).substr(-5)
		rule.remove = () => me[fn] = orig
	    rule.on     = fn
		rule.type   = (String(args[0]).match(/:(input|output)/) || [])[0] || ':wrap'
		rule.then   = thens.map( (f) => {f:f.name||"unknown"} )
		
		var fnew = function(){
			let out

			// prepare inputs
			let input = Array.prototype.slice.apply(arguments)

			let runHooks = (input) => {
				for( var i in thens ){
					let f = thens[i]
					if( f ) f.apply(this, input)
				}
			}
			// run when 
			let when = !rule.when || (rule.when && rule.exprlang && rule.exprlang(input[0],rule) )

			// run input hooks
			if( when && rule.type == ":input"  ) runHooks( clone(input) )

			// run the original function
			if( when && rule.type == ':wrap'   ) out = thens[0].apply(this, [orig].concat(input) )
			else out = orig.apply(this, input)
			
			let clonedout = typeof out == 'object' ? _(out).clone(true) : out
			if( typeof out == 'object' ) out.input = () => input
			if( when && rule.type == ":output" ) runHooks([ clonedout ])
			return out 
		}
		for( var i in this[fn] ) fnew[i] = this[fn][i] // preserve properties if any
		this.set(fn, fnew )
		this.rules.push(rule)
		return {
			when: function(rule,trigger,exprlang){
				rule.when = trigger
				rule.exprlang = exprlang
			}.bind(this, rule), 
			remove: function(id){ 
				this.rules = this.rules.filter( (o) => o.id == rule.id ? o.remove() : o)
			}.bind(this, rule)
		}
	}

	_.set = function set(path, value) {
		var last
		var o = this
		path = String(path)
		var vars = path.split(".")
		var lastVar = vars[vars.length - 1]
		vars.map(function(v) {
			if (lastVar == v) return
			o = (new Function("o","return o." + v)(o) || new Function("o","return o."+v+" = {}")(o))
			last = v
		})
		new Function("o","v","o." + lastVar + " = v")(o, value)
		return o
	}

	// borrowed from [bless.js](https://gist.github.com/coderofsalvation/61dd5c86b81e4ca6963ed0535bd806e7)
	_.get = function get(x,fallback) {
	  var obj = this
	  var o = String(x).split('.').reduce(function(acc, x) {
		  if (acc == null || acc == undefined || acc == ''){
			  return fallback;
		  }
		  return new Function("x","acc","return acc['" + x.split(".").join("']['") +"']" )(x, acc) || fallback
	  }, obj)
	  if( !o && fallback ) return _.set.call(obj,x,fallback)
	  return o
	}

	_.flatten = function(arr,opts){
		opts = opts || {}
		separator = opts.separator || '.'
		function dive(currentKey, into, target) {
			for (var i in into) {
				if (into.hasOwnProperty(i)) {
					var newKey = i;
					var newVal = into[i];
					
					if (currentKey.length > 0) {
						newKey = i.match(/[0-9]/) ? currentKey + "["+i+"]"
												  : currentKey + separator + i;
					}
					
					if (typeof newVal === "object") {
						dive(newKey, newVal, target);
					} else {
						target[newKey] = newVal;
					}
				}
			}
		}
		var newObj = {};
		dive("", arr, newObj);
		if( opts.format == 'text' ){
			for( var i in newObj ){
				if( typeof newObj[i] == 'function' )
					newObj[i] = newObj[i].toString()
										 .split("\n")
										 .slice(0,1)
										 .join("")
										 .replace(/\).*/,')')
										 .replace(/^\(/,'function(')
			}
		}
		if( opts.hide ){
			for( var i in newObj ) 
				if( opts.hide.includes(i) ) delete newObj[i]
			opts.hide.map( (h) => {
				if( typeof h != 'object' ) return
				for( var i in newObj )
					if( String(i).match(h) ) delete newObj[i]
			})
		}
		return newObj;
	}

	_(obj)

}

module.exports = on
