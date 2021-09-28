const Wallet = require("../../models/Wallets");

module.exports = async (req, res, next) => {
  Wallet.countDocuments({}, function (err, count) {
    Wallet.find({}).exec(function (err, result) {
      if (err) {
        return res.send(404, {
          status: false,
          message: err,
        });
      }
      console.log("Number of wallets:", count);
      console.log("OUTPUT", result);

      const output = [];

      for (let i = 0; i < count; i++) {
        var object = {
          walletId: result[i].stakingWalletId,
          createdDate: result[i].createdDate,
        };
        output.push(object);
      }

      return res.send(200, {
        status: true,
        message: "wallets fetched.",
        output: output,
      });
    });
  });
};
