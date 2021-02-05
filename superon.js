let clone       = (o) => o.slice ? o.map( (e) => typeof e == 'object' ? clone(e) : e )
                                 : Object.assign({}, o)    
var on
on = function on(o,f){
    let so  = on.so
    let to  = 'object'
    let globalbus = typeof o == 'object' && f
    if( o == '*' ) return so.subs.push(f) 

    so.on = function(f){
      let type
      if( typeof f == 'object' && f.slice ) { // pipe
        f = function(args, o){ return on.pipe.apply(this, args)(o) }.bind(this, Array.prototype.slice.call(arguments) )
        type = 'o'
      }
      type = type || String(f.toString().match(/(,i|i|o)\) /)||[])[0]
      let bak      = {}
      let me       = this.name //superon().me
      let parent   = this.superon().parent
      this.inputs  = this.inputs  || []
      this.outputs = this.outputs || []
      if( type == 'i' ) this.inputs.push(f)
      if( type == 'o' ) this.outputs.push(f)
      if( parent[me].on && parent[me].on.remove ) return // already wrapped

      // wrap the original function
      for( var i in this ) bak[i] = this[i]
      parent[me] = function(orig,wrap,inputs,outputs,i){
        let o   = {}
		let err = undefined
        if( String(typeof i).match(/object|function/) ) i.clone = () => clone(i)
		inputs.map( (f)  => {
			try { f(i) }catch(e){ this.superon().root.on.error({error:e,at:me}) }
		})
		o = orig(i)
		outputs.map( (f) => o = f(o) || o )
        so.subs.map( (s) => { try{ s(i,o,err) }catch(e){ err = {error:e,func:this.i,input:i,output:o} } })
        return o 
      }.bind(parent, this, this.wrap, this.inputs,this.outputs)
      for( var i in bak ) 
        if( i != this.i ) parent[me][i] = bak[i]
      parent[me].on.remove = ((prev) => () => parent[me] = prev )(this)
      so.handlers.push( parent[me] )
      return so
    }
    so.reg = (parent, root) => { // parentent, variable path
		let ignore = (i) => i.match(/^(superon|on)$/) 
		root = root || parent
        for( var i in parent ){
            if( ignore(i) ) continue 
            if( String(typeof parent[i]).match(/(function|object)/) ){ 
				if( !ignore(i) ){
					so.reg(parent[i])
					parent[i].superon = () => ({parent,  me:i, root })
					parent[i].on = so.on.bind(parent[i])
				}
				// register dummies for global bus
				//setTimeout( (parent,i) => parent[i].on( (i) => i ), 100, parent, i )
			}
        }    
    }
    if( globalbus ) so.subs.push(f) 
    o.on = so.on.bind(o)
	o.on.error = (e) => console.error(e)
    so.reg(o)
	if( globalbus ) o.msg.on( (i) => (i) )
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

if( typeof module != 'undefined' ) module.exports = on
if( typeof window != 'undefined' ) window.on = on 
