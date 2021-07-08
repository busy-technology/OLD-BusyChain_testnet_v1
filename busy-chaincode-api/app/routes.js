const errors = require("restify-errors"),
  trim_req = require("./libs/request/trim"),
  controller = require("./controllers"),
  middleware = require("./middlewares");

/**
 * List of routes
 * @param RestifyServer server
 */

module.exports = (server) => {
  // trim request parameter
  server.use(trim_req);

  /**
   * @description User registration
   * @date july-06-2021
   * @author Raj
   */

  server.post(
    "/register",
    middleware.utility.required(["userId", "password"]),
    controller.users.register
  );

  server.post("/login", controller.users.login);
};
