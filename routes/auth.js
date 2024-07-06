import passport from "passport";
import express from "express";
import GoogleStrategy from 'passport-google-oidc';
import mongoose from "mongoose";
import userSchema from '../mongooseDb.js'
import { Login, postRedis } from "./redis.js"
import Redis from "redis";
import connectRedis from "connect-redis";
// import MongoStore from 'connect-mongo';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || '';

// Initialize Redis client
const redisClient = Redis.createClient({
  host: redisHost,
  port: redisPort,
  password: redisPassword
});

(async () => {

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();
// import db from "../db.js"


// Configure the Google strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
let username = "anonymous"
let login = false;
const uri = process.env.MONGO_URI;
const dbNameURL = process.env.MONGODBNAME;

async function connectToDatabase() {
  const uri = process.env.MONGO_URI;
  const dbNameURL = process.env.MONGODBNAME;
  if (!uri) {
    throw new Error("Missing MONGOURI environment variable");
  }

  await mongoose.connect(uri, {dbName: dbNameURL});
  console.log("connected")
}

const findUser = async (profile) => {
  try {
    let redisKey = profile.id;
    let user;
    let cachedResult = await Login(redisKey);
    if (cachedResult) {
      console.log("cache found")
      user = JSON.parse(cachedResult);
    } else {
      await connectToDatabase();
    user = await userSchema.findOne({ _id: profile.id})
    if (!user) {
      user = await userSchema.create({
        _id: profile.id,
        displayName: profile.displayName,
        name: { familyName: profile.name.familyName, givenName: profile.name.givenName }
      });
      await postRedis (redisKey, 60000, JSON.stringify(user), {
        EX: 180,
        NX: true,
      })
    } else {
      console.log('User found:', user);
    }
    }
    return user;
  } catch (err) {
    console.log("error on finding user:")
    console.log(err)
  } finally {
    mongoose.connection.close();
  }
}

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'profile' ]
}, async function verify(issuer, profile, cb) {
  
  // console.log(profile)
  let foundUser = await findUser(profile);
  console.log("fo cb" +foundUser);
  if (foundUser) {
    username = profile.displayName;
    login = true;
    return cb(null, profile);
  } else {
    return cb(null, false)
  }
}));
  
// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  // process.nextTick(function() {
    cb(null, { id: user.id});
    // cb(null, { id: user.id, username: user.username, name: user.name });
  // });
});

passport.deserializeUser(async function(id, cb) {
  // process.nextTick(async function() {
    try {
      const userData = await redisClient.get(id.id);
      if (userData) {
        const user = JSON.parse(userData);
        cb(null,user)
      }
      return cb(null, null);
  }catch (err) {
    cb(err, null);
  }
  // });
});



var router = express.Router();

/* GET /login
 *
 * This route prompts the user to log in.
 *
 * The 'login' view renders an HTML page, which contain a button prompting the
 * user to sign in with Google.  When the user clicks this button, a request
 * will be sent to the `GET /login/federated/accounts.google.com` route.
 */
// router.get('/login', function(req, res, next) {
//   res.render('login');
// });

/* GET /login/federated/accounts.google.com
 *
 * This route redirects the user to Google, where they will authenticate.
 *
 * Signing in with Google is implemented using OAuth 2.0.  This route initiates
 * an OAuth 2.0 flow by redirecting the user to Google's identity server at
 * 'https://accounts.google.com'.  Once there, Google will authenticate the user
 * and obtain their consent to release identity information to this app.
 *
 * Once Google has completed their interaction with the user, the user will be
 * redirected back to the app at `GET /oauth2/redirect/accounts.google.com`.
 */
router.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

/*
    This route completes the authentication sequence when Google redirects the
    user back to the application.  When a new user signs in, a user account is
    automatically created and their Google account is linked.  When an existing
    user returns, they are signed in to their linked account.
*/
router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/'
}));
// router.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/');
//   });

/* POST /logout
 *
 * This route logs the user out.
 */
router.get('/logout', function(req, res, next) {
  login = false;
  username = "anonymous"
  console.log(login)
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});



/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Yay node!", greeting:`Hello ${username}`, loggedIn: login });
});
// module.exports = router;
export default router;
