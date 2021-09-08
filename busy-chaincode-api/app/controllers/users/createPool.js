const User = require("../../models/Users");
const Pool = require("../../models/Pools");
const voting = require("../../../blockchain/test-scripts/voting");
const tokenTransactions = require("../../models/token-transactions");

module.exports = async (req, res, next) => {
  const votingInfo = req.body.votingInfo;
  const userId = req.body.userId;
  const blockchain_credentials = req.body.credentials;
  try {
    const user = await User.findOne({ userId: userId });
    const response = await voting.CreatePool(userId, blockchain_credentials, votingInfo);
    const resp = JSON.parse(response.chaincodeResponse);
    if (resp.success == true) {
        console.log("Pool Created Successfully")
        
        const poolEntry = await new Pool({
          PoolID: resp.txId,
          PoolInfo: resp.data,
        });

        await poolEntry
          .save()
          .then((result, error) => {
            console.log("Pool info is save in database");
          })
          .catch((error) => {
            console.log("ERROR DB", error);
          });

        const tokenEntry = await new tokenTransactions({
          tokenName: "busy",
          amount: "166666000000000000000000",
          function: "CreatePool",
          txId: resp.txId,
          sender: userId,
          receiver: resp.txid,
          description:
          userId + " burned " + "166666000000000000000000" + " " + token + " for pool creation",
        });
  
        await tokenEntry
          .save()
          .then((result, error) => {
            console.log("Create Pool Transaction Recorded");
          })
          .catch((error) => {
            console.log("ERROR DB", error);
          });

        return res.send(200, {
            status: true,
            message: "Pool Created Successfully",
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
