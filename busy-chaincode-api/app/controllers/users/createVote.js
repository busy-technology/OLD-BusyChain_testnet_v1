const User = require("../../models/Users");
const voting = require("../../../blockchain/test-scripts/voting");

module.exports = async (req, res, next) => {
  const userId = req.body.userId;
  const votingAddress = req.body.votingAddress;
  const userKey = req.body.credentials;
  const amount = req.body.amount;
  const voteType = req.body.voteType;
  try {
    const user = await User.findOne({ userId: userId });
    const response = await voting.CreateVote(userId, userKey, votingAddress, amount, voteType);
    const resp = JSON.parse(response.chaincodeResponse);
    if (resp.success == true) {
        console.log("Voted successfully")
        return res.send(200, {
            status: true,
            message: "Voted successfully",
            chaincodeResponse: resp,
        })
    } else {
        console.log("Failed to execute chaincode function");
        return res.send(404, {
        status: false,
        message: resp.message,
        });
    };
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
    });
  };
};
