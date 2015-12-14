var phantom = require('phantom');
var express = require("express")
var http = require("http")
var port = process.env.PORT || 8005
var app = module.exports = express();
var request = require('request')
var config = require('./config')

app.use(SetAccessControl);
app.enable('trust proxy');

app.get('/*', checkIfStaticFile, function(req, res) {
  getSource(req.path, function(data) {
    res.status(200).send(data);
  })
});

http.createServer(app).listen(port);

//getSource("/r/worldnews/comments/27yg8m/australian_government_grabs_360_million_from_idle/", function(data) {
//console.log('got data', data)
//})

function getSource(url, cb) {
  url = url.replace('//', '/')
  url = rtrim(url, '/')

  var fullUrl = config.rootUrl + url

  phantom.create("--web-security=false", "--ignore-ssl-errors=true", "--load-images=false", '--ssl-protocol=any', '--disk-cache=true', function(ph) {
    ph.createPage(function(page) {
      console.log('loading: ', fullUrl)
      if (config.logErrors) {
        page.set('onResourceError', function(resourceError) {
          console.log('ERROR:', resourceError)
        })
      }

      page.open(fullUrl, function(status) {
        if (status === 'fail') {
          cb('failed to load url:' + url)
          ph.exit();
        } else {
          setTimeout(function() {
            page.evaluate(function() {
              return document.all[0].innerHTML;
            }, function(data) {

              ph.exit();
              return cb(data)
            });
          }, config.timeout);
        }
      });
    });

  });
}

function rtrim(str, chr) {
  var rgxtrim = (!chr) ? new RegExp('\\s+$') : new RegExp(chr + '+$');
  return str.replace(rgxtrim, '');
}

function SetAccessControl(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
}

function checkIfStaticFile(req, res, next) {
  var regex = /\.(css|js|jpg|jpeg|gif|ico|png|bmp|pict|csv|doc|pdf|pls|ppt|tif|tiff|eps|ejs|swf|midi|mid|ttf|eot|woff|otf|svg|svgz|webp|docx|xlsx|xls|pptx|ps|class|jar|)$/i;
  if (regex.test(req.path)) {
    return res.redirect(config.rootUrl + req.path)
  }
  next()
}
