import * as errorHandler from "errorhandler";
import * as socket from 'socket.io';
import * as socketController from "./controllers/socket";
/* Node app instance */
const app = require("./app");
/* Start Express server. */
const server = app.listen(app.get("port"), () => {
  console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
  console.log("  Press CTRL-C to stop\n");
});
/* Socket Io instance */
const io = socket(server)
socketController.initSocket(io);
export = server;