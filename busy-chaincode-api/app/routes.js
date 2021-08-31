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

  //auth

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
    auth,
    controller.users.register
  );

  server.post(
    "/login",
    middleware.utility.required(["userId", "password"]),
    auth,
    controller.users.login
  );

  //auth,

  server.post(
    "/createStakingAddress",
    middleware.utility.required(["userId", "credentials", "type"]),
    auth,
    controller.users.wallet
  );

  //auth

  server.post(
    "/attemptUnlock",
    middleware.utility.required(["userId", "credentials"]),
    auth,
    controller.users.attemptUnlock
  );

  server.post(
    "/buyTokens",
    middleware.utility.required(["recipiant", "amount", "token"]),
    auth,
    middleware.utility.isAmount(["amount"]),
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
    auth,
    middleware.utility.isAmount(["amount"]),
    controller.users.transfer
  );

  //auth,

  server.post(
    "/issueTokens",
    middleware.utility.required([
      "walletId",
      "credentials",
      "tokenName",
      "symbol",
      "amount",
    ]),
    auth,
    middleware.utility.isAmount(["amount"]),
    controller.users.issue
  );

  //middleware.auth.generateToken,
  //controller.auth.apiKey,

  server.post(
    "/getTotalSupply",
    middleware.utility.required(["symbol"]),
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.totalSupply
  );

  //auth

  server.post(
    "/updateTransferFees",
    middleware.utility.required(["newTransferFee"]),
    auth,
    controller.users.transferFee
  );

  server.post(
    "/burnTokens",
    middleware.utility.required(["walletId", "amount", "token"]),
    middleware.utility.isAmount(["amount"]),
    auth,
    controller.users.burn
  );

  //auth,

  server.post(
    "/vestingV1",
    middleware.utility.required([
      "recipient",
      "amount",
      "numerator",
      "denominator",
      "releaseAt",
    ]),
    middleware.utility.isAmount(["amount"]),
    middleware.utility.isAmount(["numerator"]),
    middleware.utility.isAmount(["denominator"]),
    auth,
    controller.users.vesting1
  );

  server.post(
    "/vestingV2",
    middleware.utility.required([
      "recipient",
      "amount",
      "startAt",
      "releaseAt",
    ]),
    middleware.utility.isAmount(["amount"]),
    auth,
    controller.users.vesting2
  );

  //middleware.auth.generateToken,
  //controller.auth.apiKey,

  server.post(
    "/lockedTokensInfo",
    middleware.utility.required(["walletId"]),
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.lockedTokensInfo
  );

  // server.post(
  //   "/queryWallet",
  //   middleware.utility.required(["userId", "credentials"]),
  //   controller.users.queryWallet
  // );

  // middleware.auth.generateToken,
  // controller.auth.apiKey,

  server.post(
    "/queryWalletBalances",
    middleware.utility.required(["walletId"]),
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.queryWalletAdmin
  );

  server.get(
    "/wallets",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.fetchWallets
  );

  //auth,

  server.post(
    "/recoverUser",
    middleware.utility.required(["userId", "mnemonic"]),
    auth,
    controller.users.recoverUser
  );

  // server.post(
  //   "/addAdmin",
  //   middleware.utility.required(["credentials"]),
  //   controller.users.addAdmin
  // );

  // Add in user wallets

  //middleware.auth.generateToken,
  //controller.auth.apiKey,

  server.post(
    "/userWallets",
    middleware.utility.required(["userId"]),
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.userWallets
  );
  server.post(
    "/sendMessage",
    middleware.utility.required(["sender", "recipient"]),
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.sendMessage
  );
};
