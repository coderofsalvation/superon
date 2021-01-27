module.exports = (app, opts) => {

      process.stdout.write = (function(write) {
        var fnew = function(string, encoding, fd) {
          write.call(process.stdout, string, encoding, fd);
          app.msg({output:string, plugin:"stdout"})
        };
        fnew.undo = ((write) => () => process.stdout.write = write )(write)
        return fnew
      }(process.stdout.write));

}
