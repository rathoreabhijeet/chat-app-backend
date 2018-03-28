import * as express from "express";
import * as session from "express-session";
import * as dotenv from "dotenv";
import * as mongo from "connect-mongo";

const MongoStore = mongo(session);

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: ".env.example" });

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as userController from "./controllers/user";
// API keys and Passport configuration
import * as passportConfig from "./config/passport";

export const userRouter = express.Router(); 
export const homeRouter = express.Router();

export const adminRouter = express.Router();
/**
 * home api routes.
 */
homeRouter.route("/").get(homeController.index);
/**
 * user auth api routes.
 */
userRouter.route("/login").get(passportConfig.isAuthenticated, userController.getLogin);
userRouter.route("/login").post(userController.postLogin);
userRouter.route("/logout").get(userController.logout);
userRouter.route("/forgot").post( userController.postForgot);
userRouter.route("/reset/:token").get(userController.getReset);
userRouter.route("/reset/:token").post(userController.postReset);
userRouter.route("/signup").post(userController.postSignup);
userRouter.route("/").put(passportConfig.isAuthenticated, userController.updateUser);
userRouter.route("/password").put(passportConfig.isAuthenticated, userController.updatePassword);
userRouter.route("/delete/:id").delete(passportConfig.isAuthenticated, userController.deleteUser);