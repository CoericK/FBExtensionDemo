var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Implementing Facebook Login


var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var PassportFacebookExtension = require('passport-facebook-extension');
// required for passport
var session = require('express-session');
var flash = require('connect-flash');

app.use(session({secret: 'passport-facebook-extension'})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

var FB_APP_ID = 'YOUR-APP-ID';
var FB_APP_SECRET = 'YOUR-SECRED-ID';


passport.serializeUser(function (user, done) {
    // Usually you do something like this:
    // done(null, user.id);
    // But for testing purposes i will return the whole user object:
    done(null, user)

});

passport.deserializeUser(function (id, done) {
    // Usually user is the id return the user id from the user that is logged,
    // An then you can Query the user from ur DB
    // Can do it by:
    /*
     User.findById(id, function(err, user) {
     done(err, user);
     });
     */
    /*
     In this example, only the user ID is serialized to the session, keeping the amount of data
     stored within the session small. When subsequent requests are received, this ID is used
     to find the user, which will be restored to "req.user".
     */

    // For demo purposes i will return id that is the user object that is bundled in the id variable:
    done(null, id);
});


passport.use(new FacebookStrategy({
        clientID: FB_APP_ID,
        clientSecret: FB_APP_SECRET,
        callbackURL: "/auth/facebook/callback",
        enableProof: true
    },
    function (accessToken, refreshToken, profile, done) {
        //console.log('PROFILE: ', profile);
        //console.log('Access Token: ', accessToken);
        //console.log('Refresh Token: ', refreshToken);
        // We can check if the user exists, update it, or create a new one by:
        /*
         User.findOne({
         facebook._id = profile.id;
         })
         */
        profile.accessToken = accessToken;
        // Here we use PassportFacebookExtension module by creating an instance:
        var FBExtension = new PassportFacebookExtension(FB_APP_ID, FB_APP_SECRET);

        /**
         * Extending short lived token
         */
        FBExtension.extendShortToken(accessToken)
            .then(function(response){
                console.log('Long-lived Token: ',response.access_token);
                console.log('Expires in : ',response.expires+' secs.');
            })
            .fail(function(error){
                console.log(error)
            });

        FBExtension.permissionsGiven(profile.id, accessToken)
            .then(function (permissions) {
                profile.permissions = permissions

                var acceptedFriendsPermission = false;

                permissions.forEach(function (permission) {
                    if (permission.permission == 'user_friends') {
                        acceptedFriendsPermission = true;
                    }
                });

                if (acceptedFriendsPermission) {
                    FBExtension.friendsUsingApp(profile.id, accessToken)
                        .then(function (friends) {
                            profile.friends = friends;
                            done(null, profile);
                        })
                        .fail(function (error) {
                            console.log(error);
                        });


                } else {
                    done(null, profile);
                }

            }).fail(function (e) {
                console.log(e);
            });
    }
));

app.get('/auth/facebook',
    passport.authenticate('facebook', {scope: ['read_stream', 'user_friends']})
);

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/logged',
        failureRedirect: '/?error_login'
    })
);


// Implementing Facebook Login
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
