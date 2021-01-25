module.exports = (app, opts) => {

    let enabled = false

    app.stderr = () => {
            
      enabled = !enabled
      console.log("[v] stderr")

      if( enabled ){
          console.error = (function(log) {
            var fnew = function(a, b, c, d, e, f) {
              args.unshift('[ERROR]');
              log.call(console.log, b, c, d, e, f);
              
              // string here encapsulates all the args
              app.stderr.io( b, c, d, e, f )
            };
            fnew.undo = ((orig) => () => console.error = orig )(console.error)
            return fnew
          }(console.error));
      }else {
        console.log("[ ] stderr")
        console.error.undo()
      }
    } 

    app.stderr.io = (i) => i

}
