const vestingTransactions = require("../../models/vesting1");

module.exports = async (req, res, next) => {
    vestingTransactions.find({}).exec(function (err, result) {
    if (err) {
      return res.send(200, {
        status: false,
        message: "Error occured while fetching the vesting transactions",
        Error: err,
      });
    }
    return res.send(200, {
      status: true,
      message: "Vesting transactions have been successfully fetched",
      data: result,
    });
  });
};
