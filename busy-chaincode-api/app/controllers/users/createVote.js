const User = require("../../models/Users");
const voting = require("../../../blockchain/test-scripts/voting");
const tokenTransactions = require("../../models/token-transactions");

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
      const tokenEntry = await new tokenTransactions({
        tokenName: "busy",
        amount: amount,
        function: "CreateVote",
        txId: resp.txId,
        sender: userId,
        receiver: voteType+"-"+votingAddress,
        description:
        userId + " burned " + amount + " busy for voting to poolID " + votingAddress ,
      });

      await tokenEntry
        .save()
        .then((result, error) => {
          console.log("Create Vote Transaction Recorded");
        })
        .catch((error) => {
          console.log("ERROR DB", error);
        });

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
