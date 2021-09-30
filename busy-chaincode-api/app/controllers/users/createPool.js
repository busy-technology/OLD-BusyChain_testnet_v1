const User = require("../../models/Users");
const Pool = require("../../models/Pools");
const voting = require("../../../blockchain/test-scripts/voting");
const transactions = require("../../models/transactions");
const config = require("../../../blockchain/test-scripts/config");
const bs58 = require("bs58");
const constants = require("../../../constants");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");

const {
  Certificate
} = require("@fidm/x509");

module.exports = async (req, res, next) => {
  const poolName = req.body.poolName;
  const poolDescription = req.body.poolDescription;
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

      const decodedPrivateKey = bs58.decode(
        blockchain_credentials.credentials.privateKey
      );

      blockchain_credentials.credentials.privateKey =
        decodedPrivateKey.toString();

      const response = await voting.CreatePool(walletId, user.userId, blockchain_credentials, poolName, poolDescription);
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

        const blockResponse = await config.GetBlockFromTransactionId(user.userId, blockchain_credentials, resp.txId);
        const blockResp = blockResponse.chaincodeResponse;
        const tokenEntry = await new transactions({
          tokenName: "BUSY",
          amount: resp.data.poolFee,
          function: "CreatePool",
          txId: resp.txId,
          sender: walletId,
          receiver: resp.txId,
          blockNum: blockResp.blockNum,
          dataHash: blockResp.dataHash,
          createdDate: new Date(blockResp.timestamp),
          description: walletId + " burned " + resp.data.poolFee + "BUSY" + " for pool creation",
        });

        await tokenEntry
          .save()
          .then((result, error) => {
            console.log("Create Pool Transaction Recorded");
          })
          .catch((error) => {
            console.log("ERROR DB", error);
          });

          const balanceResponse = await QueryScript.queryWallet(
            user.userId,
            blockchain_credentials,
            user.walletId,
            constants.BUSY_TOKEN
          );
          const balanceResp = JSON.parse(balanceResponse.chaincodeResponse);
          await User.updateOne({
            walletId: user.walletId
          }, {
            "$set": {
              "walletBalance": balanceResp.data
            }
          }).exec().then(doc => {
            console.log('Updating Default wallet Balance for ' + user.walletId + ' setting amount to ' + balanceResp.data);
          }).catch(err => {
            console.log(err);
            throw new Error(err);
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