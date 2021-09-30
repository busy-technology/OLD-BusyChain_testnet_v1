const Wallet = require("../../models/Wallets");

module.exports = async (req, res, next) => {
  Wallet.countDocuments({}, function (err, count) {
    Wallet.find({amount : {$ne: "0"}}).exec(function (err, result) {
      if (err) {
        return res.send(404, {
          status: false,
          message: err,
        });
      }
      const output = [];

      for (let i = 0; i < result.length; i++) {
        var object = {
          walletId: result[i].stakingWalletId,
          createdDate: result[i].createdDate,
          createdFrom: result[i].walletId,
          blockNum: result[i].blockNum,
          dataHash: result[i].dataHash
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
