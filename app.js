
// npm install express rem
var rem = require('rem')
  , express = require('express')
  , path = require('path');

/**
 * Express.
 */

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('secret', process.env.SESSION_SECRET || 'terrible, terrible secret')
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(app.get('secret')));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.set('host', 'localhost:' + app.get('port'));
  app.use(express.errorHandler());
});


app.configure('production', function () {
  app.set('host', process.env.HOST);
});

/**
 * Setup Twitter.
 */

var twitter = rem.connect('twitter.com').configure({
  key: process.env.TWITTER_KEY,
  secret: process.env.TWITTER_SECRET
});


var oauth = rem.oauth(twitter, 'http://' + app.get('host') + '/oauth/callback');

app.get('/login/', oauth.login());

app.use(oauth.middleware(function (req, res, next) {
  console.log("The user is now authenticated.");
  res.redirect('/');
}));

app.get('/logout/', oauth.logout(function (req, res) {
  res.redirect('/');
}));

// Save the user session as req.user.
app.all('/*', function (req, res, next) {
  req.api = oauth.session(req);
  next();
});

/**
 * Routes
 */

function loginRequired (req, res, next) {
  if (!req.api) {
    res.redirect('/login/');
  } else {
    next();
  }
}

// app.get('/', loginRequired, function (req, res) {
//   req.api('account/verify_credentials').get(function (err, profile) {
//     res.send('Hi ' + profile.screen_name + '! <form action="/status" method="post"><input name="status"><button>Post Status</button></form>');
//   });
// });

app.post('/status', loginRequired, function (req, res) {
  req.api('statuses/update').post({
    status: req.body.status
  }, function (err, json) {
    if (err) {
      res.json({error: err});
    } else {
      res.redirect('http://twitter.com/' + json.user.screen_name + '/status/' + json.id_str);
    }
  });
})


app.listen(app.get('port'), function () {
  console.log('Listening on http://' + app.get('host'))
});


var carrier = require('carrier');


// app.get('/stream', function (req, res) {
//   req.api.stream('statuses/filter').post({
//     track: ['obama', 'usa']
//   }, function (err, stream) {
//     carrier.carry(stream, function (line) {
//       var line = JSON.parse(line);
//       res.write(line.text + '\n');
//     });
//   });
// })

/**
 * Streaming example
 */

// var carrier = require('carrier');

app.get('/', loginRequired, function (req, res) {
  var tws = {};
  var query = 'nike';
  var date = '2013-03-26';
  var num = 3;
  var months = {'Mar': '03'}

  for (i = 0; i < 5; i++) {
    var dateChange = i - num + 2;
    var qDate = date.substring(0, 8) + (parseInt(date.substring(8)) + dateChange);

    req.api('search/tweets').get({
      q: query,
      until: qDate,
      count: 100
    }, function (err, results) {
      if (err) return console.log('error:', err);
      // console.log(results);
      var stats = results.statuses;
      var msg = [];

      for (j = 0; j < stats.length; j++) {
        msg.push(stats[j].text);
      }
      var dateCreated = stats[0].created_at;
      newDate = dateCreated.substring(26) + '-' + months[dateCreated.substring(4, 7)] + '-' + dateCreated.substring(8, 10)
      
      tws[newDate] = msg;

      console.log(tws);
    });

  }
})
