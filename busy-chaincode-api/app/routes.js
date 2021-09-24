const errors = require("restify-errors"),
  trim_req = require("./libs/request/trim"),
  controller = require("./controllers"),
  middleware = require("./middlewares"),
  auth = require("./middlewares/auth"),
  adminAuth = require("./middlewares/adminAuth");

/**
 * List of routes
 * @param RestifyServer server
 */

module.exports = (server) => {
  // trim request parameter
  server.use(trim_req);

  server.post(
    "/auth/generate-token-user",
    middleware.auth.generateToken,
    controller.auth.generateToken
  );

  server.post(
    "/auth/generate-token-admin",
    middleware.auth.generateToken,
    controller.auth.generateTokenAdmin
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
    middleware.utility.required(["walletId", "credentials"]),
    auth,
    controller.users.attemptUnlock
  );

  server.post(
    "/buy",
    middleware.utility.required(["recipiant", "amount", "token"]),
    middleware.utility.isAmount(["amount"]),
    adminAuth,
    controller.users.buy
  );

  server.post(
    "/transfer",
    middleware.utility.required([
      "sender",
      "credentials",
      "recipiant",
      "amount",
      "token",
    ]),
    middleware.utility.isAmount(["amount"]),
    auth,
    controller.users.transfer
  );


  server.post(
    "/updateBlocks",
    controller.auth.apiKey,
    controller.users.updateBlocks
  );


  server.get(
    "/getBlocks",
    controller.auth.apiKey,
    controller.users.getBlocks
  );

  server.post(
    "/claim",
    middleware.utility.required(["stakingAddr"]),
    auth,
    controller.users.claim
  );

  server.post(
    "/unstake",
    middleware.utility.required(["stakingAddr"]),
    auth,
    controller.users.unstake
  );

  //auth,

  server.post(
    "/issue",
    middleware.utility.required([
      "walletId",
      "credentials",
      "tokenName",
      "symbol",
      "amount",
      "decimals",
    ]),
    middleware.utility.isAmount(["amount"]),
    middleware.utility.isAmount(["decimals"]),
    middleware.utility.isAlphaNumeric(["tokenName"]),
    middleware.utility.isAlphaNumeric(["symbol"]),
    auth,
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
    middleware.utility.isAmount(["newTransferFee"]),
    controller.users.transferFee
  );

  server.post(
    "/burn",
    middleware.utility.required(["walletId", "amount", "token"]),
    middleware.utility.isAmount(["amount"]),
    adminAuth,
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
    adminAuth,
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
    adminAuth,
    controller.users.vesting2
  );

  //middleware.auth.generateToken,
  //controller.auth.apiKey,

  server.post(
    "/lockedVestingInfo",
    middleware.utility.required(["walletId"]),
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.lockedVestingInfo
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
    "/stakingAddresses",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.fetchWallets
  );

  server.get(
    "/defaultWallets",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.stakingAddresses
  );

  server.get(
    "/currentPhase",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.getCurrentPhase
  );

  server.get(
    "/transactionFees",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.getCurrentFee
  );

  server.get(
    "/transactions",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.transactions,
  );

  server.get(
    "/issuedCoins",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.issuedCoins
  );

  server.get(
    "/getVestingV1",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.getVestingV1,
  );

  server.get(
    "/getVestingV2",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.getVestingV2,
  );

  server.get(
    "/sendMessageTransactions",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.sendMessageTransactions,
  );

  server.post(
    "/stakingInfo",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.stakingInfo
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

  // endpoint for creating pool
  server.post(
    "/createPool",
    middleware.utility.required(["walletId","credentials","poolName", "poolDescription"]),
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.createPool
  );

  // endpoint for pool Config
  server.get(
    "/poolConfig",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.getPoolConfig
  );

   // endpoint for pool Config
   server.post(
    "/poolConfig",
    middleware.utility.required([
      "minimumCoins",
      "poolFee",
      "votingPeriod",
      "votingStartTime",
    ]),
    adminAuth,
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.updatePoolConfig
  );

  // endpoint for creating pool
  server.get(
    "/queryPool",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.queryPool
  );

  // endpoint for pool history
  server.get(
    "/poolHistory",
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.poolHistory
  );

  // endpoint for creating vote
  server.post(
    "/createVote",
    middleware.utility.required([
      "walletId",
      "credentials",
      "votingAddress",
      "amount",
      "voteType",
    ]),
    middleware.auth.generateToken,
    controller.auth.apiKey,
    controller.users.createVote
  );

  // endpoint for destroying the pool
  server.post(
    "/destroyPool",
    middleware.auth.generateToken,
    adminAuth,
    controller.auth.apiKey,
    controller.users.destroyPool
  );
};
