import * as async from "async";
import * as crypto from "crypto";
import * as nodemailer from "nodemailer";
import * as passport from "passport";
import { default as User, UserModel, AuthToken } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
const request = require("express-validator");
/**
 * GET /user/login
 * Login page.
 */
export let getLogin = (req: Request, res: Response) => {
  if (req.user) {
    return res.status(200).send({
      user: req.user
    });
  }
  return res.status(401).send({
    msg: 'User is unauthorized'
  });
};

/**
 * POST /user/login
 * Sign in using email and password.
 */
export let postLogin = (req: Request, res: Response, next: NextFunction) => {
  req.assert("password", "Password must be at least 6 characters long").len({ min: 6 });
  req.sanitize("email").normalizeEmail({ gmail_remove_dots: false })
  req.assert("email", "email cannot be blank").notEmpty();
  req.assert("email", "email is not valid").isEmail();
  const errors = req.validationErrors();
  if (errors) {
    return res.status(400).send(errors)
  }

  passport.authenticate("local", (err: Error, user: UserModel, info: IVerifyOptions) => {
    if (err) { return res.status(400).send(err) }
    if (!user) {
      return res.status(400).send([{ location: "internal", param: "auth", msg: info.message }]);
    }
    req.logIn(user, (err) => {
      if (err) { return res.status(400).send(err) }
      res.status(200).send({ msg: "Success! You are logged in.", user: user })
    });
  })(req, res, next);
};

/**
 * GET /user/logout
 * Log out.
 */
export let logout = (req: Request, res: Response) => {
  req.logout();
  res.status(200).send({
    msg: 'Logout successfully'
  })
};



/**
 * POST /user/signup
 * Create a new local account.
 */
export let postSignup = (req: Request, res: Response, next: NextFunction) => {
  req.assert("email", "email cannot be blank").notEmpty();
  req.assert("email", "email is not valid").isEmail();
  req.sanitize("email").normalizeEmail({ gmail_remove_dots: false })
  req.assert("password", "Password must be at least 6 characters long").len({ min: 6 });
  req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);
  const errors = req.validationErrors();
  if (errors) {
    return res.status(400).send(errors)
  }
  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) { return res.status(400).send(err); }
    if (existingUser) {
      return res.status(400).send([{ location: "body", param: "email", msg: "Account with that email already exists." }]);
    }
    const user = new User({
      profile: {
        name: req.body.name
      },
      email: req.body.email,
      password: req.body.password
    });
    user.save((err) => {
      if (err) { return res.status(400).send(err); }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(400).send(err);
        }
        res.status(200).send({
          user: req.user
        })
      });
    });
  });
};



/**
 * PUT /user/
 * Update logged in user information.
 */
export let updateUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.email) {
    req.assert("email", "Please enter a valid email address.").isEmail();
    req.sanitize("email").normalizeEmail({ gmail_remove_dots: false })
  };
  const errors = req.validationErrors();

  if (errors) {
    return res.status(400).send(errors);
  }

  User.findById(req.user._id, (err, user: UserModel) => {
    if (err) { return res.status(400).send(err); }
    req.body.email ? user.email = req.body.email : "";
    typeof req.body.user_valid === 'boolean' ? user.user_valid = req.body.user_valid : "";
    req.body.profile && req.body.profile.name ? user.profile.name = req.body.profile.name : "";
    req.body.profile && req.body.profile.gender ? user.profile.gender = req.body.profile.gender : "";
    req.body.profile && req.body.profile.picture ? user.profile.picture = req.body.profile.picture : "";
    user.save((err: WriteError) => {
      if (err) {
        if (err.code === 11000) {
          return res.status(400).send(err);
        }
        return res.status(400).send(err);
      }
      return res.status(200).send({
        "success": { msg: "Profile information has been updated." }
      });
    });
  });
};

/**
 * PUT /user/password
 * Update user current password.
 */
export let updatePassword = (req: Request, res: Response, next: NextFunction) => {
  req.assert("password", "Password must be at least 4 characters long").len({ min: 4 });
  req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);
  const errors = req.validationErrors();
  if (errors) {
    return res.status(400).send(errors);
  }

  User.findById(req.user._id, (err, user: UserModel) => {
    if (err) { return res.status(400).send(err); }
    user.password = req.body.password;
    user.save((err: WriteError) => {
      if (err) { return res.status(400).send(err); }
      res.status(200).send({ msg: "Password has been changed." });
    });
  });
};

/**
 * DELETE /user/delete
 * Delete user account.
 */
export let deleteUser = (req: Request, res: Response, next: NextFunction) => {
  let deleteId = req.params.id ? req.params.id : req.user._id;
  User.remove({ _id: deleteId }, (err) => {
    if (err) { return res.status(400).send(err) }
    req.logout();
    res.status(200).send({ msg: "Your account has been deleted." });
  });
};


/**
 * POST /
 * Get all user list
 */
export let getUsers = (req: Request, res: Response) => {
  User.find({ _id: { $ne: req.user._id } } , (err: any, users: Document) => {
      if (err) { return res.status(400).send(err); }
      return res.status(200).send({
        users: users,
        msg: "Get users list"
      });
    });
};