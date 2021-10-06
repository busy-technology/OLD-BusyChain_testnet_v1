const transactions = require("../../models/transactions");

module.exports = async (req, res, next) => {
  transactions.find({}).exec(function (err, result) {
    if (err) {
      return res.send(200, {
        status: false,
        message: "Error occured while fetching the transactions",
        Error: err,
      });
    }
    return res.send(200, {
      status: true,
      message: "Transactions have been successfully fetched",
      data: result,
    });
  });
};
