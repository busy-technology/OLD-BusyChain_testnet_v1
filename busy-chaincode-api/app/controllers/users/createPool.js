const User = require("../../models/Users");
const Pool = require("../../models/Pools");
const voting = require("../../../blockchain/test-scripts/voting");
const tokenTransactions = require("../../models/token-transactions");
const constants = require("../../../constants");
const { Certificate } = require("@fidm/x509");

module.exports = async (req, res, next) => {
  const votingInfo = req.body.votingInfo;
  const walletId = req.body.walletId;
  const blockchain_credentials = req.body.credentials;
  try {
    const user = await User.findOne({
      walletId: walletId
    });
    if (user) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchain_credentials.credentials.certificate, "utf-8")
      ).subject.commonName;
      console.log("CN", commanName);
      if (user.userId != commanName) {
        return res.send(404, {
          status: false,
          message: `This certificate is not valid.`,
        });
      }

      if (
        blockchain_credentials.type != "X.509" ||
        blockchain_credentials.mspId != "BusyMSP"
      ) {
        console.log("type of certificate incorrect.");
        return res.send(404, {
          status: false,
          message: `Incorrect type or MSPID.`,
        });
      }
      const response = await voting.CreatePool(walletId, user.userId, blockchain_credentials, votingInfo);
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
          amount: constants.CREATE_POOL_AMOUNT,
          function: "CreatePool",
          txId: resp.txId,
          sender: walletId,
          receiver: resp.txId,
          description: walletId + " burned " + constants.CREATE_POOL_AMOUNT + " " + token + " for pool creation",
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
    } else {
      console.log("WalletId do not exists.");
      return res.send(404, {
        statPus: false,
        message: `WalletId do not exists.`,
      });
    }
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
    });
  };
};