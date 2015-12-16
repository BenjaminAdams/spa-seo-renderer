# spa-seo-renderer
Allows search engines to crawl and index your single page app!

Search engine bots are notoriously bad at crawling single page apps.  Search engines will normally not let the AJAX requests finish before indexing your pages content.  This will pre-render the page for them, allowing your SPA to be crawled properly.

####Setup instructions
These instructions will guide you through setting this up for free on [Heroku](https://heroku.com)
* Create a new Heroku App.  If you've never set one up before read [this](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction). I just created one at [https://seo-renderer.herokuapp.com](https://seo-renderer.herokuapp.com)
* From the CLI run run `heroku buildpacks:set https://github.com/ddollar/heroku-buildpack-multi.git` to add [heroku-buildpack-multi](https://github.com/ddollar/heroku-buildpack-multi) buildpack to heroku project.
* Modify config.js file to your needs
* Modify your existing application to redirect search engine bots to this app.  If your website is built with nodejs you can use the [express-device](https://github.com/rguerreiro/express-device) npm module.

example code to redirect when a search engine bot is making the request.  You would modify your existing website to detect if its a search engine

NodeJS SPA example
```js
app.get("*", function(req, res) {
  if (req.device.type === 'bot') {
      request.get('https://seo-renderer.herokuapp.com' + req.path, function(error, response, body) {
        res.send(200, body)
      });
  } else {
    res.render('index')
  }
})
```

php SPA example
```php
//at the top of your php file
if (isset($_SERVER['HTTP_USER_AGENT']) && preg_match('/bot|crawl|slurp|spider/i', $_SERVER['HTTP_USER_AGENT'])) {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    echo file_get_contents('https://seo-renderer.herokuapp.com' +$path);
    exit;
  }
```

c# SPA example
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
          return Ok();
        }
      }

      public string FetchFromBot(string urlPath) {
        WebClient client = new WebClient();
        Stream data = client.OpenRead("https://seo-renderer.herokuapp.com"+ urlPath);
        StreamReader reader = new StreamReader(data);
        var pageContent = reader.ReadToEnd();
        data.Close();
        reader.Close();
        return pageContent
      }

    }
```
You can see it running in [https://seo-renderer.herokuapp.com](https://seo-renderer.herokuapp.com) do Right click -> View source and you can see the ajax content is loaded into the HTML for search engine goodness
