/*
 * GET users listing.
 */

var exec = require('child_process').exec
  ;

exports.exec = function (script, args, callback) {

  var command = [
    'R',
    '--vanilla',
    '--slave',
    '--args'
  ];

  command = command.concat(args);
  command.push('<');
  command.push(script);

  exec(command.join(' '), function(err, stdout, stderr) {
    callback(err, stdout, stderr);
  });

}
