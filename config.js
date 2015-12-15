module.exports = {
  rootUrl: 'https://redditjs.com', //domain to render for
  timeout: 7000, //How long you think it will take to fetch from your domain and then wait for the ajax calls to finish? (milliseconds)
  logErrors: false, //output errors to the console
  useCache: true, //stores the contents of your site in /tmp
  cacheExpiry: 43200000, //How long till the cache expires.  Put this number to about how often your sites content changes. (milliseconds)
  cacheDirectory: '/tmp' //where to save the cache
}
