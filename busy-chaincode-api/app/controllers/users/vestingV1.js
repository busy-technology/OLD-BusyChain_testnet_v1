const Admin = require("../../models/admin");
const User = require("../../models/Users");
const vestingTransactions = require("../../models/vesting1");
const vestingV1 = require("../../../blockchain/test-scripts/vestingV1");
const config = require("../../../blockchain/test-scripts/config");
const constants = require("../../../constants");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");

module.exports = async (req, res, next) => {
  try {
    const recipient = req.body.recipient,
      amount = req.body.amount,
      numerator = req.body.numerator,
      denominator = req.body.denominator,
      releaseAt = req.body.releaseAt,
      adminId = "busy_network";
    var userId = "sample";

    console.log("IN USER");
    const adminData = await Admin.findOne({
      userId: adminId
    });
    console.log("ADMIN", adminData);

    const credentials = {
      certificate: adminData.certificate.credentials.certificate,
      privateKey: adminData.certificate.credentials.privateKey,
    };

    const blockchain_credentials = {
      credentials: credentials,
      mspId: adminData.certificate.mspId,
      type: adminData.certificate.type,
    };

    const user = await User.findOne({
      walletId: recipient
    });
    console.log("User", user);
    if (user) {
      userId = user.userId;
      const response1 = await vestingV1.vestingV1(
        userId,
        blockchain_credentials,
        recipient,
        amount,
        numerator,
        denominator,
        releaseAt
      );
      console.log("RESPONSE 1", response1);
      const response = JSON.parse(response1.chaincodeResponse);
      console.log("DATA 2", response);
      const txId = response.txId;
      console.log("TRANSACTION ID", txId);

      if (response.success == true) {
        const blockResponse = await config.GetBlockFromTransactionId(
          user.userId,
          blockchain_credentials,
          txId
        );
        const blockResp = blockResponse.chaincodeResponse;
        const vestingEntry = await new vestingTransactions({
          recipient: recipient,
          amount: amount,
          numerator: numerator,
          denominator: denominator,
          releaseAt: releaseAt,
          txId: txId,
          blockNum: blockResp.blockNum,
          dataHash: blockResp.dataHash,
          createdDate: new Date(blockResp.timestamp),
        });

        await vestingEntry
          .save()
          .then((result, error) => {
            console.log("Vest token transaction recorded.");
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
          message: "Tokens vested.",
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
      console.log("WalletId do not exists.");
      return res.send(404, {
        status: false,
        message: `WalletId do not exists.`,
      });
    }
  } catch (exception) {
    console.log("EXCEPTION", exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
      Error: exception.message,
    });
  }
};