function on(obj){

    let pad         = (value, length) => (value.toString().length < length) ? pad(value+" ", length) : value;
    let ls          = () => console.table(this.dump())
    let clone       = (o) => Object.assign({}, o)

    let api = {

        error: (o) => (msg) => console.error("superon: "+msg), 
	
        serialize: (o) => () => o.rules, 

        load: (o) => (i, when) => {
            let add = (rule) => {
              let cb = function(rule, input){
                  if( when(input,rule) ) rule.then.map( (t) => {
                      if( !this.get(t.f) ) return this.on.error("function "+t.f+" does not exist :/")
                      this.get(t.f)(input, t.opts) 
                  })
              }.bind(o, rule)
              rule.exprlang = when
              cb.rule = rule
              o.on(rule.on, cb)
            }
            if( typeof i == 'object' && !i.slice ) add(i)
            else i.map( add )
        }, 

        remove: (o) => () => {
            if( !o.rules ) return
            o.rules = o.rules.filter( (o) => o.remove() )
            o.rules = []
        }, 

        dump: (o) => () => {
            let depth = ''
            let out   = []
            let functions = o.flatten(o, {hide:Object.keys(_).concat(['on',/rules.*/])})
            let then2str = (t) => t.f+"("+( t.opts ? JSON.stringify(t.opts).replace(/^{/,'{') : '' )+')' 
            let len = 30
            for ( var i in functions ) {
                out.push({on:pad(i, len)})
                o.rules.map( (rule) => {
                    if( !rule.on.replace(/:.*/,'').match(i) ) return
                    let then = rule.then
                    then.map( (t) => {
                        let r = Object.assign({},rule)
                        r.on = pad(r.on+(r.type||''),len)
                        r.then = pad( then2str( t ), len)
                        delete r.remove
                        delete r.type
                        delete r.exprlang
                        out.push( r )
                    })
                })
            }
            return out
        }, 

        ls:        (o) => () => console.table( o.on.dump() ), 
        dot:       (o) => () => {
            let nodes = []
            o.rules.map( (r) => {
                r.then.map( (t) => {
                    let s = `\t\t"${r.on.replace(/:.*/,'')}" -> "${ t.f + (o.get(t.f)?'':' ?!?') }" [ label = "${r.type.replace(/:/,'')}" ]`
                    nodes.push(s)
                })
            })
            return `digraph finite_state_machine {
                rankdir=LR;
                size="10"
                node [shape = circle];

a{nodes.join("\n")}
            }`
        }
    }

    // here comes the super on function

    let on = function(){
        let args   = Array.prototype.slice.apply(arguments)
        let fn     = String(args[0]).replace(/:.*/, '').split(" ")[0]
        this.rules = this.rules || []
        var orig     = this.get(fn)
        var is_async = (f) => _.get(f, 'constructor.name') == 'AsyncFunction'
        var thens   = args.slice(1)
        var rule
        if( thens[0].rule ) rule = thens[0].rule
        else {
            rule        = {}
            rule.then   = thens.map( (f) => ({f:f.path || f.name}) )
            rule.id     = String(new Date().getTime()).substr(-5)
        }
        rule.on     = fn
        rule.remove = () => this[fn] = orig
        rule.type   = (String(args[0]).match(/:(input|output)/) || [])[0] || ':wrap'
        
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
            
            let clonedout = typeof out == 'object' ? clone(out) : out
            if( typeof out == 'object' ) out.input = () => input
            if( when && rule.type == ":output" ) runHooks([ clonedout ])
            return out 
        }
        fnew.rule = rule 
        for( var i in this[fn] ) 
            if( i != "rule" ) fnew[i] = this[fn][i] // preserve properties if any
        this.set(fn, fnew )
        this.rules.push(rule)
        return {
            when: function(rule,trigger,exprlang){
                rule.when = trigger
                rule.exprlang = exprlang
            }.bind(this, rule), 
            remove: function(id){ 
                this.rules = this.rules.filter( (o) => this.id == rule.id ? this.remove() : o)
            }.bind(this, rule)
        }
    }

	let _ = (o, opts) => {
	  o = o || {}
	  opts = opts || []
	  if( o.on ) return o // already done
	  for( var i in _ ) o[i] = _[i].bind( o )
      o.on = on.bind(o)
      for ( var i in api ) o.on[i] = api[i](o)
      o.rules = o.rules || []
	  return o
	}
		
	_.undo = function(){ 
		for ( var i in _ ) delete this[i]
		return this
	}

	_.set = function set(path, value) {
		var last
		var o = this
		path = String(path)
		var vars = path.split(".")
		var lastVar = vars[vars.length - 1]
        if( typeof value == 'function' ) value.path = path 
		vars.map(function(v) {
			if (lastVar == v) return
			o = (new Function("o","return o." + v)(o) || new Function("o","return o."+v+" = {}")(o))
			last = v
		})
        try {
            new Function("o","v","o." + lastVar + " = v")(o, value)
        } catch (e) { console.error("could not set "+path) }
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
		if( opts.hide ){
			for( var i in newObj )
                if( opts.hide.includes(i) || ( opts.type && typeof newObj[i] != opts.type ) )
                    delete newObj[i]
			opts.hide.map( (h) => {
				if( typeof h != 'object' ) return
				for( var i in newObj ) if( String(i).match(h) ) delete newObj[i]
			})
		}
		return newObj;
	}

	_(obj)

}
        
on.server = typeof window == 'undefined'

module.exports = on
