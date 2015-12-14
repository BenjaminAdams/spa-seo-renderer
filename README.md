# spa-seo-renderer
Allows search engines to crawl and index your single page app!

Search engine bots are notoriously bad at crawling single page apps.  Search engines will normally not let the AJAX requests finish before indexing your pages content.  This will pre-render the page for them.



####Setup instructions
These instructions will guide you through setting this up for free on [Heroku](https://heroku.com)
* Install phantomjs `apt-get install phantomjs`
* Modify config file to your needs
* Modify your existing application to redirect search engine bots to this app.  If your website is built with nodejs you can use the [express-device](https://github.com/rguerreiro/express-device) npm module.

example code to redirect when a search engine bot is making the request.  You would modify your existing website to detect if its a search engine

NodeJS example
```js
app.get("*", function(req, res) {
  if (req.device.type === 'bot') {
      request.get('Whatever URL you are installing spa-seo-renderer at' + req.path, function(error, response, body) {
        res.send(200, body)
      });
  } else {
    res.render('index')
  }
})
```

php example
```php
//at the top of your php file
if (isset($_SERVER['HTTP_USER_AGENT']) && preg_match('/bot|crawl|slurp|spider/i', $_SERVER['HTTP_USER_AGENT'])) {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    echo file_get_contents('Whatever URL you are installing spa-seo-renderer at' +$path);
    exit;
  }
```

c# example
```c#
public class ExampleApp: ApiController {
    [HttpGet]
      public IHttpActionResult DisplayPage() {
        bool iscrawler = Regex.IsMatch(Request.UserAgent, @ "bot|crawler|baiduspider|80legs|ia_archiver|voyager|curl|wget|yahoo! slurp|mediapartners-google", RegexOptions.IgnoreCase);
        if (iscrawler) {
          var path = = new Uri(HttpContext.Current.Request.Url.AbsoluteUri).path
          return Ok(FetchFromBot());
        } else {

          //continue normally
        }
      }

      public string FetchFromBot(string urlPath) {

        WebClient client = new WebClient();
        Stream data = client.OpenRead(args[0]);
        StreamReader reader = new StreamReader(data);
        var pageContent = reader.ReadToEnd();
        data.Close();
        reader.Close();
        return pageContent
      }

    }
```
