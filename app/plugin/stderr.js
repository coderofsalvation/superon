module.exports = (app, opts) => {

  console.error = (function(error) {
    var fnew = function(a, b, c, d, e, f) {
      error.call(console, a)
      app.msg({plugin:'stderr', output:a+"\n"})
    };
    fnew.undo = ((orig) => () => console.error = orig )(console.error)
    return fnew
  }(console.error));

  process.on('uncaughtException',  function(err) {
        console.error('uncaughtException: ' + err);
  })

}
