const claimTransactions = require("../../models/stakingClaimTransactions");

module.exports = async (req, res, next) => {
  claimTransactions.find({}).exec(function (err, result) {
    if (err) {
      return res.send(200, {
        status: false,
        message: "Error occured while fetching the staking transactions",
        Error: err,
      });
    }
    return res.send(200, {
      status: true,
      message: "Staking transactions have been successfully fetched",
      data: result,
    });
  });
};
