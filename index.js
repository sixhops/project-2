require('dotenv').config();
const express = require('express');
const ejsLayouts = require('express-ejs-layouts');
const session = require('express-session');
const passport = require('./config/ppConfig');
const flash = require('connect-flash');
const isLoggedIn = require('./middleware/isLoggedIn');
const helmet = require('helmet');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const db = require('./models');
const RateLimit = require('express-rate-limit');

const app = express();

app.set('view engine', 'ejs');

app.use(require('morgan')('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(ejsLayouts);
app.use(helmet());

// Rate limiters for login and signup
const loginLimiter = new RateLimit({
  windowMs: 1000 * 60 * 5,
  max: 3,
  message: 'Maximum login attempts exceeded. Please try again later.'
});
const signupLimiter = new RateLimit({
  windowMs: 1000 * 60 * 60,
  max: 3,
  message: 'Maximum accounts created. Please try again later.'
});

// Apply rate limiters to the routes
// app.use('/auth/login', loginLimiter);
// app.use('/auth/signup', signupLimiter);

// Store sessions in the database
const sessionStore = new SequelizeStore({
  db: db.sequelize,
  expiration: 1000 * 60 * 30
});

// Session must come before flash and passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore
}));

// Use this line once to set up the store table
sessionStore.sync();

// Must come after session and before passport middleware
app.use(flash());

// This must come after we setup the session
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  res.locals.alerts = req.flash();
  res.locals.currentUser = req.user;
  next();
});

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/profile', isLoggedIn, function(req, res) {
  res.render('profile');
});

app.use('/auth', require('./controllers/auth'));

var server = app.listen(process.env.PORT || 3000);

module.exports = server;
