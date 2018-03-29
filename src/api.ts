import * as express from "express";
import * as session from "express-session";
import * as dotenv from "dotenv";
import * as mongo from "connect-mongo";

const MongoStore = mongo(session);

/* Load environment variables from .env file, where  passwords and database url are configured */
dotenv.config({ path: ".env.example" });

/* Controllers (route handlers) */
import * as userController from "./controllers/user";
import * as chatRoomController from "./controllers/chatRoom";
import * as messageController from "./controllers/message";
/* Passport configuration */
import * as passportConfig from "./config/passport";
/* Express router instance */
export const userRouter = express.Router();
export const homeRouter = express.Router();
export const chatRoomRouter = express.Router();
export const messgaeRouter = express.Router();
/* user auth api routes. */
userRouter.route("/login").get(passportConfig.isAuthenticated, userController.getLogin);
userRouter.route("/").get(passportConfig.isAuthenticated, userController.getUsers);
userRouter.route("/login").post(userController.postLogin);
userRouter.route("/logout").get(userController.logout);
userRouter.route("/signup").post(userController.postSignup);
userRouter.route("/").put(passportConfig.isAuthenticated, userController.updateUser);
userRouter.route("/password").put(passportConfig.isAuthenticated, userController.updatePassword);
userRouter.route("/delete/:id").delete(passportConfig.isAuthenticated, userController.deleteUser);
/* chat_room api routes. */
chatRoomRouter.route("/").get(passportConfig.isAuthenticated, chatRoomController.getChatRoom);
chatRoomRouter.route("/").post(passportConfig.isAuthenticated, chatRoomController.postChatRoom);
/* message api routes. */
messgaeRouter.route("/:chat_room_id").get(passportConfig.isAuthenticated, messageController.getMessage);
messgaeRouter.route("/").post(passportConfig.isAuthenticated, messageController.postMessage);