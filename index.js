const express = require('express');
const session = require('express-session');
const fetch = require('node-fetch')
const passport = require('passport');
const LichessStrategy = require('passport-lichess').Strategy;

const port = process.env.PORT || 5000;
const uri = process.env.URI || 'https://lichess-bot-upgrader.herokuapp.com'

passport.use(new LichessStrategy({
  clientID: process.env.CLIENT_ID,
  callbackURL: uri + '/auth/lichess/callback',
  scope: 'bot:play'
},
function(accessToken, refreshToken, profile, cb) {
  console.log(`id : ${profile.id}\naccessToken : hidden\nrefreshToken : ${refreshToken}`)
  profile.accessToken = accessToken
  return cb(null, profile)
}))

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((obj, cb) => cb(null, obj));

const app = express();

app.use(session({secret:'some-secret', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/lichess', passport.authenticate('lichess'));

app.get('/auth/lichess/callback',
  passport.authenticate('lichess', {
    successRedirect: '/bot',
    failureRedirect: '/fail'
  }));

app.get('/', (_req, res) => res.send(`<a href='/auth/lichess'>Login with Lichess</a>`));
app.get('/bot', (req, res) => res.send(`Hello <a href='https://lichess.org/@/${req.user.username}'>${req.user.username}</a> <br><br><a href='/bot/upgrade'>Upgrade to a bot account</a> <b>(This is irreversible!)<b>`));
app.get('/fail', (_req, res) => res.send('Authentication failed'));

app.get('/bot/upgrade', (req, res) => {	
	fetch('https://lichess.org/api/bot/account/upgrade', {
		method: 'POST',
		body: '',
		headers: {
			Authorization: `Bearer ${req.user.accessToken}`,
			Accept: 'application/json'
		}
	}).then(response => response.text().then(content => res.send(`Upgrade status : <b>${content}</b> .`)))
})

app.listen(port, () => {
	console.log(`Listening at port ${port}`)
})