const IssuetokenTransactions = require("../../models/issued-tokens");

module.exports = async (req, res, next) => {
  IssuetokenTransactions.countDocuments({}, function (err, count) {
    IssuetokenTransactions.find({}).exec(function (err, result) {
      if (err) {
        return res.send(404, {
          status: false,
          message: err,
        });
      }
      console.log("Number of issued Tokens:", count);
      console.log("OUTPUT", result);

      const output = [];

      for (let i = 0; i < count; i++) {
        var object = {
          tokenName: result[i].tokenName,
          tokenSupply: result[i].tokenSupply,
          tokenAdmin: result[i].tokenAdmin,
          tokenDecimals: result[i].tokendeciamls,
          tokenSymbol: result[i].tokenSymbol,
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
        message: "Token has been successfully fetched",
        output: output,
      });
    });
  });
};
