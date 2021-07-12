const required = require("../middlewares/utility/required");

module.exports = {
  users: {
    register: require("./users/register"),
    login: require("./users/login"),
    wallet: require("./users/createWallet"),
    queryWallet: require("./users/queryWallet"),
  },
};
