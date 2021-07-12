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
    middleware.utility.required(["userId", "password", "confirmPassword"]),
    controller.users.register
  );

  server.post(
    "/login",
    middleware.utility.required(["userId", "password"]),
    controller.users.login
  );

  server.post(
    "/createWallet",
    middleware.utility.required(["userId", "credentials"]),
    controller.users.wallet
  );

  server.post(
    "/queryWallet",
    middleware.utility.required(["userId", "credentials"]),
    controller.users.queryWallet
  );
};
