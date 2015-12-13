var phantom = require('phantom');
var express = require("express")
var http = require("http")
var port = process.env.PORT || 8005
var server = module.exports = express();
var request = require('request')
var cheerio = require('cheerio')
var config = require('./config')

var rootUrl = 'https://redditjs.com'

server.use(SetAccessControl);
server.enable('trust proxy');

server.get('/*', CheckIfStaticFile, function(req, res) {
  getSource(req.path, function(data) {
    res.status(200).send(data);
  })
});

http.createServer(server).listen(port);

//getSource("/r/worldnews/comments/27yg8m/australian_government_grabs_360_million_from_idle/", function(data) {
//console.log('got data', data)
//})

function getSource(url, cb) {
  url = url.replace('//', '/')
  url = rtrim(url, '/')

  var attempts = 0;

  var fullUrl = config.rootUrl + url

  phantom.create("--web-security=false", "--ignore-ssl-errors=true", "--load-images=false", '--ssl-protocol=any', '--disk-cache=true', function(ph) {
    ph.createPage(function(page) {
      page.set('onResourceError', function(resourceError) {
        console.log('ERROR:', resourceError)
      })

      console.log('loading: ', fullUrl)
      page.open(fullUrl, function(status) {
        //console.log("opened page= ", status);

        if (status === 'fail') {
          cb('failed to load url:' + url)
          ph.exit();
        } else {
          evaluatePage(page, attempts, ph, cb)
        }
      });
    });

  });
}

function isItLoaded(data) {
  if (data.contains('jsonp=jQuery')) {
    return false
  }

  $ = cheerio.load(data);
  var minContentLength = 100
  var srLength = $('#siteTableContainer').text().length
  var thepostLength = $('.singlePagePost').text().length

  if ($('#siteTableContainer').length && srLength < minContentLength) {
    // console.log('still loading ', srLength)
    return false
  } else if ($('.singlePagePost').length && thepostLength < minContentLength) {
    //  console.log('still loading ', thepostLength)
    return false
  } else {
    //  console.log('DONE ', data.length)
    return true
  }

}

function evaluatePage(page, attempts, ph, cb) {

  waitFor(
    page,
    "span.from", // wait for this object to appear
    (new Date()).getTime() + config.timeout, // start timeout 
    function(status) {
      system.stderr.writeLine("- submission status: " + status);

      if (status) {
        // success, element found by waitFor()
        page.render("/tmp/results.png");
        process_rows(page);
      } else {
        // waitFor() timed out
        phantom.exit(1);
      }
    }
  );

  setTimeout(function() {
    attempts++
    page.evaluate(function() {
      return document.all[0].innerHTML;
    }, function(data) {

      if (isItLoaded(data) === true || attempts > 20) {
        cb(data)
        ph.exit();
      } else {
        evaluatePage(page, attempts, ph, cb)
      }

    });
  }, 500);
}

function waitFor(page, selector, expiry, callback) {
  system.stderr.writeLine("- waitFor( " + selector + ", " + expiry + " )");

  // try and fetch the desired element from the page
  var result = page.evaluate(
    function(selector) {
      return document.querySelector(selector);
    }, selector
  );

  // if desired element found then call callback after 50ms
  if (result) {
    system.stderr.writeLine("- trigger " + selector + " found");
    window.setTimeout(
      function() {
        callback(true);
      },
      50
    );
    return;
  }

  // determine whether timeout is triggered
  var finish = (new Date()).getTime();
  if (finish > expiry) {
    system.stderr.writeLine("- timed out");
    callback(false);
    return;
  }

  // haven't timed out, haven't found object, so poll in another 100ms
  window.setTimeout(
    function() {
      waitFor(page, selector, expiry, callback);
    },
    100
  );
}

function rtrim(str, chr) {
  var rgxtrim = (!chr) ? new RegExp('\\s+$') : new RegExp(chr + '+$');
  return str.replace(rgxtrim, '');
}

String.prototype.contains = function(it) {
  return this.indexOf(it) != -1;
};

function SetAccessControl(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
}

function CheckIfStaticFile(req, res, next) {
  var regex = /\.(css|js|jpg|jpeg|gif|ico|png|bmp|pict|csv|doc|pdf|pls|ppt|tif|tiff|eps|ejs|swf|midi|mid|ttf|eot|woff|otf|svg|svgz|webp|docx|xlsx|xls|pptx|ps|class|jar|)$/i;
  if (regex.test(req.path)) {
    return res.redirect(config.rootUrl + req.path)
  }
  next()
}
