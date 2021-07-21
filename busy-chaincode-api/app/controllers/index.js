const required = require("../middlewares/utility/required");

module.exports = {
  users: {
    register: require("./users/register"),
    login: require("./users/login"),
    wallet: require("./users/createWallet"),
    queryWallet: require("./users/queryWallet"),
    queryWalletAdmin: require("./users/queryWalletAdmin"),
    fetchWallets: require("./users/wallets"),
  },

  auth: {
    generateToken: require("./auth/generate-token"),
    apiKey: require("./auth/apiKey"),
  },
};
