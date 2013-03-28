// /**
//  * Module dependencies.
//  */

// var express = require('express')
//   , rem = require('rem')
//   , routes = require('./routes')
//   , user = require('./routes/user')
//   , http = require('http')
//   , path = require('path');

// var app = express();

// app.configure(function(){
//   app.set('port', process.env.PORT || 3000);
//   app.set('views', __dirname + '/views');
//   app.set('view engine', 'jade');
//   app.use(express.favicon());
//   app.use(express.logger('dev'));
//   app.use(express.bodyParser());
//   app.use(express.methodOverride());
//   app.use(express.cookieParser(app.get('secret')));
//   app.use(express.session());
//   app.use(app.router);
//   app.use(express.static(path.join(__dirname, 'public')));
// });

// app.configure('development', function(){
//   app.use(express.errorHandler());
// });

// // app.get('/', routes.index);
// // app.get('/users', user.list);

// // http.createServer(app).listen(app.get('port'), function(){
// //   console.log("Express server listening on port " + app.get('port'));
// // });


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
  res.redirect('/home');
}));

app.get('/logout/', oauth.logout(function (req, res) {
  res.redirect('/home');
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

app.get('/home',loginRequired,function (req,res){
  res.render('index', { title: 'Express' });
});

app.get('/', loginRequired, function (req, res) {
  tws = {};
  reverse = {}
  var query = 'nike';
  var date = '2013-03-26';
  var num = 3;
  var months = {'Mar': '03'}

  var sentiment_client = rem.createClient({format: 'json'}).configure({uploadFormat: 'form'});
  var sentiment_url = 'http://api.repustate.com/v2/cf5226b5f78306bc0ce268ed1c79577358276760/score.json'
  


  for (i = 0; i < 5; i++) {
    var dateChange = i - num + 2;
    var qDate = date.substring(0, 8) + (parseInt(date.substring(8)) + dateChange);

    req.api('search/tweets').get({
      q: query,
      until: qDate,
      count: 5
    }, function (err, results) {
      if (err) return console.log('error:', err);
      // console.log(results);
      var stats = results.statuses;
      var msg = [];

      for (j = 0; j < stats.length; j++) {
        var tweet = stats[j].text;
        msg.push(tweet);

      }
      var dateCreated = stats[0].created_at;
      newDate = dateCreated.substring(26) + '-' + months[dateCreated.substring(4, 7)] + '-' + dateCreated.substring(8, 10)

      tws[newDate] = msg;
      for (i =0; i< msg.length; i++){
        reverse[msg[i]] = newDate
      }
      // console.log(tws);

    });
  } 
    // console.log('helloo');
    setTimeout(function(){
      num = {}
      // console.log(tws);
      // console.log(reverse);
      for(date in tws) {
        if (!num[date]) {
          num[date] = []
          for(i =0; i< tws[date].length; i++){
            // console.log(i);
            tweet = tws[date][i]
            sentiment_client(sentiment_url).post({'text': tweet}, 
             function(err, result){
               tweet = result.text;
               // console.log("TWWWETTT:  ", tweet);
              // console.log(reverse[tweet]);
               newdate = reverse[tweet];

               // console.log(newdate);
               num[newdate].push(result.score);
               // console.log(result);
             });
            // console.log(tweet);
          }
        }
      }

      setTimeout(function(){

        // console.log(num);
        final = {}
        date_arr = [];
        pos_arr = [];
        neg_arr = [];
        for(date in num){
          date_arr.push(date);
          pos_arr.push(average(num[date], 'p'));
          neg_arr.push(average(num[date], 'n'));
        }
        
        console.log(date_arr);
        console.log(pos_arr);
        console.log(neg_arr); 

        // console.log(final);
      }, 7000);
    }, 6000);

  
})

var average = function(array, type){
  pos_sum = 0.0;
  neg_sum = 0.0;
  pos_count = 0;
  neg_count = 0;

  for(i=0; i < array.length; i++){

    if(array[i] != 0){
      if (type=='p'){
        if(parseFloat(array[i])>0.0){
          pos_sum += parseFloat(array[i]);
          pos_count++;
        }
      }
      if (type=='n'){
        if(parseFloat(array[i])<0.0){
          neg_sum += parseFloat(array[i]);
          neg_count++;
        }
      }

    }
  
  }
  // console.log(pos_sum);
  pos_average = pos_sum/pos_count;
  if (pos_count==0) {pos_average = 0.5;}

  neg_average = neg_sum/neg_count;
  if (neg_count==0) {neg_average = -0.5;}
  
  if (type == 'p') {return pos_average;}
  if (type == 'n') {return neg_average;}
}
