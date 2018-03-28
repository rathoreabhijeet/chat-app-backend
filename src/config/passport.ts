import * as passport from "passport";
import * as request from "request";
import * as passportLocal from "passport-local";
import * as _ from "lodash";

// import { User, UserType } from '../models/User';
import { default as User } from "../models/User";
import { Request, Response, NextFunction } from "express";

const LocalStrategy = passportLocal.Strategy;

passport.serializeUser<any, any>((user, done) => {
  done(undefined, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).exec((err, user) => {
    done(err, user);
  });
});


/**
 * Sign in using email and password.
 */
passport.use(new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
  User.findOne({ email: email }).populate('profile.picture').exec((err: any, user: any) => {
    if (err) { return done(err); }
    if (!user) {
      return done(undefined, false, { message: `Email ${email} not found.` });
    }
    user.comparePassword(password, (err: Error, isMatch: boolean) => {
      if (err) { return done(err); }
      if (isMatch) {
        user.last_login = new Date();
        user.save();
        return done(undefined, user);
      }
      return done(undefined, false, { message: "Invalid email or password." });
    });
  });
}));

export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // if(!req.user)
  //   User.findById("5a976601aa02df3d03f98a9c").populate('profile.picture').exec((err, user) => {
  //    req.user = user;
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({});
  //});
};