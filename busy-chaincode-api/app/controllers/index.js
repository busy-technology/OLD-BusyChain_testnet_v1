const required = require("../middlewares/utility/required");

module.exports = {
  users: {
    register: require("./users/register"),
    login: require("./users/login"),
    wallet: require("./users/createWallet"),
    attemptUnlock: require("./users/attemptUnlock"),
    buy: require("./users/buyTokens"),
    transfer: require("./users/transferToken"),
    issue: require("./users/issueTokens"),
    totalSupply: require("./users/totalSupply"),
    transferFee: require("./users/transferFees"),
    burn: require("./users/burnToken"),
    vesting1: require("./users/vestingV1"),
    vesting2: require("./users/vestingV2"),
    lockedTokensInfo: require("./users/lockedTokensInfo"),
    queryWallet: require("./users/queryWallet"),
    queryWalletAdmin: require("./users/queryWalletAdmin"),
    fetchWallets: require("./users/wallets"),
    recoverUser: require("./users/recoverUser"),
    addAdmin: require("./users/addAdmin"),
    userWallets: require("./users/userWallets"),
    sendMessage: require("./users/sendMessage"),
  },

  auth: {
    generateToken: require("./auth/generate-token"),
    apiKey: require("./auth/apiKey"),
  },
};
