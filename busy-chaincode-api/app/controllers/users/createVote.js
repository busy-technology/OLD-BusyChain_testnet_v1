const User = require("../../models/Users");
const voting = require("../../../blockchain/test-scripts/voting");
const transactions = require("../../models/transactions");
const { Certificate } = require("@fidm/x509");
const config = require("../../../blockchain/test-scripts/config");
const bs58 = require("bs58");
const constants = require("../../../constants");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");

module.exports = async (req, res, next) => {
  const walletId = req.body.walletId;
  const votingAddress = req.body.votingAddress;
  const blockchain_credentials = req.body.credentials;
  const amount = req.body.amount;
  const voteType = req.body.voteType;
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
          message: `User’s certificate is not valid`,
        });
      }

      if (
        blockchain_credentials.type != "X.509" ||
        blockchain_credentials.mspId != "BusyMSP"
      ) {
        console.log("type of certificate incorrect.");
        return res.send(404, {
          status: false,
          message: `Incorrect type or MSPID`,
        });
      }
      const decodedPrivateKey = bs58.decode(
        blockchain_credentials.credentials.privateKey
      );

      blockchain_credentials.credentials.privateKey =
        decodedPrivateKey.toString();

      const response = await voting.CreateVote(walletId,user.userId, blockchain_credentials, votingAddress, amount, voteType);
      const resp = JSON.parse(response.chaincodeResponse);
      if (resp.success == true) {
        const blockResponse = await config.GetBlockFromTransactionId(user.userId, blockchain_credentials,resp.txId);
        const blockResp = blockResponse.chaincodeResponse;
        const tokenEntry = await new transactions({
          tokenName: "BUSY",
          amount: amount,
          function: "CreateVote",
          txId: resp.txId,
          sender: walletId,
          blockNum: blockResp.blockNum,
          dataHash: blockResp.dataHash,
          createdDate: new Date(blockResp.timestamp),
          receiver: voteType + "-" + votingAddress,
          description: walletId + " burned " + amount + " busy for voting to poolID " + votingAddress,
        });

        await tokenEntry
          .save()
          .then((result, error) => {
            console.log("Create Vote Transaction Recorded");
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
  

        console.log("Voted successfully")
        return res.send(200, {
          status: true,
          message: "Your vote has been successfully counted",
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
      console.log("Wallet does not exist");
      return res.send(404, {
        status: false,
        message: `Wallet does not exist`,
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