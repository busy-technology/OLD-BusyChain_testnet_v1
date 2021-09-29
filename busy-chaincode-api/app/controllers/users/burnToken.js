const Admin = require("../../models/admin");
const transactions = require("../../models/transactions");
const burn = require("../../../blockchain/test-scripts/burnTokens");
const config = require("../../../blockchain/test-scripts/config");
const User = require("../../models/Users");

module.exports = async (req, res, next) => {
  try {
    const address = req.body.walletId,
      token = req.body.token,
      amount = req.body.amount,
      adminId = "ordererAdmin",
      userId = "sample";

    console.log("IN USER");
    const adminData = await Admin.findOne({ userId: adminId });
 
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

    const response1 = await burn.burnTokens(
      userId,
      blockchain_credentials,
      address,
      amount,
      token
    );
    console.log("RESPONSE 1", response1);
    const response = JSON.parse(response1.chaincodeResponse);
    console.log("DATA 2", response);
    const txId = response.txId;
    console.log("TRANSACTION ID", txId);

    if (response.success == true) {
      const blockResponse = await config.GetBlockFromTransactionId(adminId, blockchain_credentials,txId);
      const blockResp = blockResponse.chaincodeResponse;
      await User.updateOne({
        walletId: address,
      }, {
        "$inc": {
          "walletBalance": -1*amount
        }
      }, function (err, doc) {
        if (err) return new Error(err);
      });

      const tokenEntry = await new transactions({
        tokenName: token,
        amount: amount,
        function: "Burn Tokens",
        txId: txId,
        sender: adminId,
        receiver: address,
        blockNum: blockResp.blockNum,
        dataHash: blockResp.dataHash,
        description:
          adminId + " burned " + amount + " " + token + " of " + address,
        createdDate: new Date(blockResp.timestamp),
      });

      await tokenEntry
        .save()
        .then((result, error) => {
          console.log("Burn Token transaction recorded.");
        })
        .catch((error) => {
          console.log("ERROR DB", error);
        });

      return res.send(200, {
        status: true,
        message: "Tokens burned.",
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
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
      Error: exception.message,
    });
  }
};
