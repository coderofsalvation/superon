module.exports = (app, opts) => {

    let enabled = false

    app.stdout = () => {
          enabled = !enabled
          console.log(`[${enabled?'v':' '}] stdout`)

          if( enabled ){
              process.stdout.write = (function(write) {
                var fnew = function(string, encoding, fd) {
                  app.stdout.io(string)
                  write.call(process.stdout, string, encoding, fd);
                };
                fnew.undo = ((write) => () => process.stdout.write = write )(write)
                return fnew
              }(process.stdout.write));
          }else process.stdout.write.undo()
    }
    
    app.stdout.io = (i) => i

}
