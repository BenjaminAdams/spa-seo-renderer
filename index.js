var fs = require('fs')
var phantom = require('phantom')
var express = require("express")
var http = require("http")
var port = process.env.PORT || 8005
var app = module.exports = express();
var request = require('request')
var config = require('./config')

app.use(SetAccessControl);
app.enable('trust proxy');

app.get('/*', checkIfStaticFile, checkCache, function(req, res) {
  getSource(req.path, function(data) {

    res.status(200).send(data);

  })
});

http.createServer(app).listen(port);

//getSource("/r/worldnews/comments/27yg8m/australian_government_grabs_360_million_from_idle/", function(data) {
//console.log('got data', data)
//})

function getSource(urlPath, cb) {
  urlPath = urlPath.replace('//', '/')
  urlPath = rtrim(urlPath, '/')

  var fullUrl = config.rootUrl + urlPath

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
          cb('failed to load urlPath:' + urlPath)
          ph.exit();
        } else {
          setTimeout(function() {
            page.evaluate(function() {
              return document.all[0].innerHTML;
            }, function(data) {
              ph.exit();
              saveCache(urlPath, data, function() {
                return cb(data)
              })
            });
          }, config.timeout);
        }
      });
    });
  });
}

function saveCache(urlPath, data, cb) {
  if (config.useCache !== true) return

  try {
    fs.writeFile(GetCacheFileName(urlPath), data, function(err) {
      if (err) console.log(err);
      console.log('just saved', urlPath);
      cb()
    });
  } catch (e) {
    next(false)
  }

}

function checkCache(req, res, next) {
  if (config.useCache !== true) return

  try {

    fs.stat(GetCacheFileName(req.path), function(err, stats) {
      if (err || !stats) return next(false)
      if (Date.now() + config.cacheExpiry > (new Date(stats.mtime).getTime())) {
        return next(false) //cache is expired, go fetch a new one
      }

      fs.readFile(GetCacheFileName(req.path), function(err, data) {
        if (err || !data) return next(false)
          //console.log('found file in cache!', data, err)
        res.status(200).send(data);
      });

    })

  } catch (e) {
    next(false)
  }

}

function GetCacheFileName(urlPath) {
  return config.cacheDirectory + '/' + urlPath.replace(/[^a-z0-9]/gi, '_')
}

function rtrim(str, chr) {
  var rgxtrim = (!chr) ? new RegExp('\\s+$') : new RegExp(chr + '+$');
  return str.replace(rgxtrim, '');
}

function ltrim(str, chr) {
  var rgxtrim = (!chr) ? new RegExp('^\\s+') : new RegExp('^' + chr + '+');
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
