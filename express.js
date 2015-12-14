var express = require('express');
var app = module.exports.app = exports.app = express();

var router = express.Router();

app.use(require('connect-livereload')());

app.use('/', express.static('build'));
// app.use('/upload', function(req, res){
//     res.send('upload API coming soon');
// });
app.use(function(req, res) {
  res.redirect('/');
});

app.listen(3000);
