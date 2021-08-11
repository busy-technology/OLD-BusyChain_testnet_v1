const required = require("../middlewares/utility/required");

module.exports = {
  users: {
    register: require("./users/register"),
    login: require("./users/login"),
    wallet: require("./users/createWallet"),
    buy: require("./users/buyTokens"),
    transfer: require("./users/transferToken"),
    issue: require("./users/issueTokens"),
    totalSupply: require("./users/totalSupply"),
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
