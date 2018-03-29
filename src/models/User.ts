import * as bcrypt from "bcrypt-nodejs";
import * as crypto from "crypto";
import * as mongoose from "mongoose";

export type UserModel = mongoose.Document & {
  email: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: Date;
  tokens: AuthToken[],
  profile: {
    name: string,
    gender: string,
    picture: string;
  };
  last_login: Date;
  user_valid: boolean;
  status: string;
  user_role: string;
  comparePassword: (candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;
};

export type AuthToken = {
  accessToken: string,
  kind: string
};

const userSchema = new mongoose.Schema({
  email: { type: String, trim: true, index: true, unique: true, sparse: true },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  tokens: Array,
  profile: {
    email: String,
    name: String,
    gender: {
      type: String,
      default: '',
      enum: ['male', 'female', 'transgender', ''],
    },
  },
  last_login: Date,
  user_valid: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive'],
  },
  user_role: {
    type: String,
    default: 'user'
  }
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
  const user = this;
  if (!user.isModified("password")) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword: string, cb: (err: any, isMatch: any) => {}) {
  bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};
const User = mongoose.model("User", userSchema);
export default User;