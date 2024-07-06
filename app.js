import "dotenv/config.js"

import createError from 'http-errors';
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
// import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import session from "express-session";
import csrf from "csurf";
import passport from "passport"
import SQLiteStoreConnect from 'connect-sqlite3'
import pluralize from "pluralize";
import Redis from "redis";
import connectRedis from "connect-redis";
// import MongoStore from 'connect-mongo';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || '';

let redisClient = Redis.createClient({
  host: redisHost,
  port: redisPort,
  password: redisPassword
});
redisClient.connect().catch(console.error);

const redisStore = new connectRedis({
  client: redisClient,
  prefix: "CPSC2650"
});


// (async () => {

//   redisClient.on("error", (error) => console.error(`Error : ${error}`));

//   await redisClient.connect();
//   console.log("Redis Connected")
// })();

// Check Redis connection
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

// Constants
const port = process.env.PORT || 3000;

var app = express();

// view engine setup
app.set('views', path.join('views'));
app.set('view engine', 'pug');

app.locals.pluralize = pluralize;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join('public')));
app.use(session({
  store: redisStore,
  secret: 'keyboard cat',
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(csrf());
app.use(passport.authenticate('session'));
app.use(function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});
app.use(function(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// app.use('/', indexRouter);
app.use('/', authRouter);


app.get("/print-sessions", (req, res) => {
  const sessionStore = req.sessionStore;
  sessionStore.all((err, sessions) => {
    if (err) {
      console.error("Error fetching sessions:", err);
      res.status(500).send("Failed to fetch sessions");
      return;
    }
    res.send(sessions);
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});