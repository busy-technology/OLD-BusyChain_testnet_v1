const errors = require("restify-errors"),
  trim_req = require("./libs/request/trim"),
  controller = require("./controllers"),
  middleware = require("./middlewares"),
  auth = require("./middlewares/auth");

/**
 * List of routes
 * @param RestifyServer server
 */

module.exports = (server) => {
  // trim request parameter
  server.use(trim_req);

  server.post(
    "/auth/generate-token",
    middleware.auth.generateToken,
    controller.auth.generateToken
  );

  /**
   * @description User registration
   * @date july-06-2021
   * @author Raj
   */

  server.post(
    "/register",
    middleware.utility.required(["userId", "password", "confirmPassword"]),
    middleware.utility.number(["mobile"]),
    middleware.utility.userId(["userId"]),
    middleware.utility.isName(["firstName"]),
    middleware.utility.isName(["lastName"]),
    middleware.utility.isCountry(["country"]),
    middleware.utility.isPassword(["password"]),
    middleware.utility.isPassword(["confirmPassword"]),
    middleware.utility.isEmail(["email"]),
    controller.users.register
  );

  server.post(
    "/login",
    middleware.utility.required(["userId", "password"]),
    auth,
    controller.users.login
  );

  server.post(
    "/createStakingAddress",
    middleware.utility.required(["userId", "credentials", "type"]),
    auth,
    controller.users.wallet
  );

  server.post(
    "/buyTokens",
    middleware.utility.required(["recipiant", "amount", "token"]),
    controller.users.buy
  );

  server.post(
    "/transferTokens",
    middleware.utility.required([
      "sender",
      "credentials",
      "recipiant",
      "amount",
      "token",
    ]),
    controller.users.transfer
  );

  server.post(
    "/issueTokens",
    middleware.utility.required([
      "userId",
      "credentials",
      "tokenName",
      "symbol",
      "amount",
    ]),
    auth,
    controller.users.issue
  );

  server.post(
    "/queryWallet",
    middleware.utility.required(["userId", "credentials"]),
    auth,
    controller.users.queryWallet
  );

  // middleware.auth.generateToken,
  // controller.auth.apiKey,

  server.post(
    "/queryWalletBalances",
    middleware.utility.required(["walletId"]),
    controller.users.queryWalletAdmin
  );

  server.get(
    "/wallets",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.fetchWallets
  );

  server.post(
    "/recoverUser",
    middleware.utility.required(["userId", "mnemonic"]),
    auth,
    controller.users.recoverUser
  );

  server.post(
    "/addAdmin",
    middleware.utility.required(["credentials"]),
    controller.users.addAdmin
  );

  // Add in user wallets

  //middleware.auth.generateToken,
  //controller.auth.apiKey,

  server.post(
    "/userWallets",
    middleware.utility.required(["userId"]),
    controller.users.userWallets
  );
};
