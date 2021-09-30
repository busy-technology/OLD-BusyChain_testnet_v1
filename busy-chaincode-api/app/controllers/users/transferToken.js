const User = require("../../models/Users");
const {
  Certificate
} = require("@fidm/x509");
const transactions = require("../../models/transactions");
const transferScript = require("../../../blockchain/test-scripts/transferTokens");
const config = require("../../../blockchain/test-scripts/config");
const bs58 = require("bs58");
const constants = require("../../../constants");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");

module.exports = async (req, res, next) => {
  try {
    const sender = req.body.sender,
      blockchain_credentials = req.body.credentials,
      recipiant = req.body.recipiant,
      amount = req.body.amount,
      token = req.body.token;

    const user = await User.findOne({
      walletId: sender,
    });
    console.log("User", user);

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

      const receiver = await User.findOne({
        walletId: recipiant,
      });

      if (receiver) {
        const decodedPrivateKey = bs58.decode(
          blockchain_credentials.credentials.privateKey
        );

        blockchain_credentials.credentials.privateKey =
          decodedPrivateKey.toString();

        const response1 = await transferScript.transferToken(
          sender,
          blockchain_credentials,
          recipiant,
          amount,
          token
        );
        console.log("RESPONSE 1", response1);
        const response = JSON.parse(response1.chaincodeResponse);
        console.log("CHECK", response);
        console.log("DATA 2", response);
        const txId = response.txId;
        console.log("TRANSACTION ID", txId);
        const blockResponse = await config.GetBlockFromTransactionId(
          sender,
          blockchain_credentials,
          txId
        );
        const blockResp = blockResponse.chaincodeResponse;
        if (response.success == true) {
          const tokenEntry = await new transactions({
            tokenName: token,
            amount: amount,
            function: "Transfer",
            txId: txId,
            sender: sender,
            receiver: recipiant,
            blockNum: blockResp.blockNum,
            dataHash: blockResp.dataHash,
            createdDate: new Date(blockResp.timestamp),
            description: sender +
              " transferred " +
              amount +
              " " +
              token +
              " to " +
              recipiant,
          });

          await tokenEntry
            .save()
            .then((result, error) => {
              console.log("Token transfer transaction recorded.");
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
          }).exec().then(user => {
            console.log('Updating Default wallet Balance for ' + user.walletId + ' setting amount to ' + balanceResp.data);
          }).catch(err => {
            console.log(err);
            throw new Error(err);
          });

          const balanceResponseRecipient = await QueryScript.queryWallet(
            receiver.userId,
            blockchain_credentials,
            receiver.walletId,
            constants.BUSY_TOKEN
          );
          const balanceRespRecipient = JSON.parse(balanceResponseRecipient.chaincodeResponse);

          await User.updateOne({
            walletId: receiver.walletId,
          }, {
            "$set": {
              "walletBalance": balanceRespRecipient.data,
            }
          }).exec().then(doc => {
            console.log('Updating Default wallet Balance for ' + receiver.walletId + ' setting amount to ' + balanceRespRecipient.data);
          }).catch(err => {
            console.log(err);
            throw new Error(err);
          });


          return res.send(200, {
            status: true,
            message: sender +
              " transferred " +
              amount +
              " " +
              token +
              " to " +
              recipiant,
            chaincodeResponse: response,
          });
        } else {
          console.log("Failed to execute chaincode function");
          return res.send(404, {
            status: false,
            message: `Failed to execute chaincode function.`,
            chaincodeResponse: response,
          });
        }
      } else {
        console.log("recipient walletId do not exists.");
        return res.send(404, {
          status: false,
          message: `recipient walletId do not exists.`,
        });
      }
    } else {
      console.log("sender walletId do not exists.");
      return res.send(404, {
        status: false,
        message: `sender walletId do not exists.`,
      });
    }
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
      Error: exception.message,
    });
  }
};