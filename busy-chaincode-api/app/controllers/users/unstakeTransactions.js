const unstakeTransactions = require("../../models/unstakeTransactions");

module.exports = async (req, res, next) => {
    unstakeTransactions.find({}).exec(function (err, result) {
    if (err) {
      return res.send(200, {
        status: false,
        message: "Error occured while fetching the unstake transactions",
        Error: err,
      });
    }
    return res.send(200, {
      status: true,
      message: "Unstake transactions have been fetched",
      data: result,
    });
  });
};
