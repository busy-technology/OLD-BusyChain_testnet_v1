const sendMessageTransactions = require("../../models/sendmessage");

module.exports = async (req, res, next) => {
    sendMessageTransactions.find({}).exec(function (err, result) {
    if (err) {
      return res.send(200, {
        status: false,
        message: "Error occured while fetching the message transactions",
        Error: err,
      });
    }
    return res.send(200, {
      status: true,
      message: "Messaging transactions have been successfully fetched",
      data: result,
    });
  });
};
