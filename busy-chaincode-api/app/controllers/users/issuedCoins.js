const IssuetokenTransactions = require("../../models/isssued-tokens");

module.exports = async (req, res, next) => {
  IssuetokenTransactions.countDocuments({}, function (err, count) {
    IssuetokenTransactions.find({}).exec(function (err, result) {
      if (err) {
        return res.send(404, {
          status: false,
          message: err,
        });
      }
      console.log("Number of issued Coins:", count);
      console.log("OUTPUT", result);

      const output = [];

      for (let i = 0; i < count; i++) {
        var object = {
          coinName: result[i].tokenName,
          coinSupply: result[i].tokenSupply,
          coinAdmin: result[i].tokenAdmin,
          coinDecimals: result[i].tokendeciamls,
          coinSymbol: result[i].tokenSymbol,
          txId: result[i].txId,
          sender: "Busy network",
          receiver: result[i].receiver,
          logoPath: result[i].logoPath,
          websiteUrl: result[i].websiteUrl,
          socialMedia: result[i].socialMedia,
          createdDate: result[i].createdDate,
          blockNum: result[i].blockNum,
          dataHash: result[i].dataHash
        };
        output.push(object);
      }

      return res.send(200, {
        status: true,
        message: "Coins fetched.",
        output: output,
      });
    });
  });
};
