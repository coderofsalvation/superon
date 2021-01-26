let clone       = (o) => o.slice ? o.map( (e) => typeof e == 'object' ? clone(e) : e )
								 : Object.assign({}, o)	
var on
on = function on(o,f){
	let so  = on.so
    let to  = 'object'
	if( o == '*' ) return so.subs.push(f) 

    so.on = function(f){
	  let type
	  if( typeof f == 'object' && f.slice ) {
	    f = function(args, o){ return on.pipe.apply(this, args)(o) }.bind(this, Array.prototype.slice.call(arguments) )
		type = 'o'
	  }
	  type = type || String(f.toString().match(/(,i|i|o)\) /)||[])[0]
	  let bak  = {}
	  this.inputs  = this.inputs  || []
	  this.outputs = this.outputs || []
	  if( type == 'i' ) this.inputs.push(f)
	  if( type == 'o' ) this.outputs.push(f)
	  if( this.par[ this.i ].on.remove ) return // already wrapped

	  // wrap the original function
	  if( type == ',' ) this.par[ this.i ].wrap = f
	  for( var i in this ) bak[i] = this[i]
	  this.par[ this.i ] = function(orig,wrap,inputs,outputs,i){
		let o   = {}
		i.clone = () => clone(i)
		try{
			inputs.map( (f) => f(i) )
			o = orig(i)
			outputs.map( (f) => o = f(o) || o )
		}catch(e){ o = {error:e,input:i,func:this.i}}
		so.subs.map( (s) => { try{ s(i,o) }catch(e){ o = {error:e,func:this.i,input:i,output:o} } })
		return o 
	  }.bind(this.par, this, this.wrap, this.inputs,this.outputs)
	  for( var i in bak ) 
		if( i != this.i ) this.par[ this.i ][i] = bak[i]
	  this.par[ this.i ].on.remove = ((orig) => () => this.par[this.i] = orig )(this)
	  so.handlers.push( this.par[ this.i ] )
      return so
    }
	so.reg = (par) => { // parent, variable path
		for( var i in par ){
			if( i != "on" && String(typeof par[i]).match(/(function|object)/) ) so.reg(par[i])
			par[i].par = par
			par[i].i  = i
			par[i].on = so.on.bind(par[i])
		}	
	}
	so.reg(o)
	o.on = so.on.bind(o)
}


on.pipe = function(fns) {
  return function(item) {
 	   return fns.reduce(function(prev,  fn) {
 			  return fn(prev);
 	   },  item);
  }
}
on.so     = {subs:[],handlers:[]}
on.server = typeof window == 'undefined'
on.remove = () => {
	on.so.handlers.map( (h) => h.on.remove() )
	on.so.handlers = []
}

module.exports = on

