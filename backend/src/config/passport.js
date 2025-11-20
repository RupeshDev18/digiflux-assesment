const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
require("dotenv").config();

const hasGoogleCredentials =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

console.log("Google Client ID present:", !!process.env.GOOGLE_CLIENT_ID);
console.log("Google OAuth enabled:", hasGoogleCredentials);

if (hasGoogleCredentials) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log(
            "Google OAuth profile received for:",
            profile.emails[0].value
          );

          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            console.log("existing user:", user.email);
            return done(null, user);
          }

          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            user.googleId = profile.id;
            await user.save();
            console.log("Linked Google account to existing user:", user.email);
            return done(null, user);
          }

          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value,
          });

          console.log("Created new user:", user.email);
          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log("Google OAuth credentials - missing");
}

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.email);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user ID:", id);
    const user = await User.findById(id);
    if (!user) {
      return done(new Error("User not found"), null);
    }
    console.log("Deserialized user:", user.email);
    done(null, user);
  } catch (error) {
    console.error("Deserialize error:", error);
    done(error, null);
  }
});

module.exports = passport;
