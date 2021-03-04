<center>
	<img width="30%" src="https://raw.githubusercontent.com/coderofsalvation/superon/master/img/logo.png"/>

</center>

SUPERON is a tiny functional bus (nodejs+browser) which separates mechanisms vs policy:

<center>
	<img src="https://raw.githubusercontent.com/coderofsalvation/superon/master/img/a.JPG"/>
</center>

* **fast**: BAM!
* **tiny**: only 917 bytes (gzipped)
* **simple**: your functions **are** the events, byebye `emit('some-event')`
* **business rule engine**: add your own expression language and save/load rules from db

## pied piper

<center> 
	<img src="https://raw.githubusercontent.com/coderofsalvation/superon/master/img/c.JPG"/>
</center>

## bizniz rools!

<center> 
	<img src="https://raw.githubusercontent.com/coderofsalvation/superon/master/img/b.JPG"/>
</center>

## custom errors

```
on(app)
app.on.error = (e) => console.error(e)
```

## extendable modules

let mod = require('module_somebody_made')

on(mod)
mod.export.on( (o) => {
  // bugfix: export() should always return object to prevent
  //         further crashes along the pipeline
  if( !o ) return {error:"empty object"}
})

// 0 pullrequests made                        
// 0 bothered maintainers

## immutable when needed 

```
app.foo.fork = (i) => i 
app.foo.on( (i) => app.foo.fork( i.clone() ) )
```

## easy housekeeping 


```
var hook = app.foo.on( (i) => i.x+=1 )
hook.remove() // remove one
on.remove()   // remove all BAM!

```

## immersive-cli-driven development with SUPERON 

* SUPERON is **service-agnostic**: turn on/off multi-services (http/mqtt/irc/etc) using superon
* **end-user friendly**: pass enduser-expression languages like [filtrex](https://npmjs.com/filtrex) or [json-logic-js](https://npmjs.com/json-logic-js) to `.when()`
* **database friendly**: save/load enduser-rules using `.load()` and `.serialize()`
* **plugins**: functions as plugins
* **isomorphic cli**: control/modify policies using `curl`, browser
* **immersive cli**: easily extendable with [vorpal](https://npmjs.com/vorpal), [inquirer](https://npmjs.com/inquirer), [enquirer](https://npmjs.com/enquirer)


## Philosophy

* Unix rule policy vs mechanism
* Unix rule of transparency 

## Easy-peasy plugins

<img src="https://raw.githubusercontent.com/coderofsalvation/superon/master/img/test.svg"/>

// todo
