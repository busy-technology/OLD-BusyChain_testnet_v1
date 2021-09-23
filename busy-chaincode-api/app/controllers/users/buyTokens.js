const User = require("../../models/Users");
const Admin = require("../../models/admin");
const transactions = require("../../models/transactions");
const transferScript = require("../../../blockchain/test-scripts/transferTokens");
const config = require("../../../blockchain/test-scripts/config");

module.exports = async (req, res, next) => {
  try {
    const recipiant = req.body.recipiant,
      userId = req.body.recipiant,
      amount = req.body.amount,
      token = req.body.token,
      adminId = "ordererAdmin";

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

    console.log("BLOCK", blockchain_credentials);

    const user = await User.findOne({ walletId: recipiant });
    console.log("User", user);
    if (user) {
      const response1 = await transferScript.transferToken(
        userId,
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

      if (response.success == true) {

        const blockResponse = await config.GetBlockFromTransactionId(adminId, blockchain_credentials,txId);
        const blockResp = blockResponse.chaincodeResponse;
        const tokenEntry = await new transactions({
          tokenName: token,
          amount: amount,
          function: "Buy",
          txId: txId,
          sender: adminId,
          receiver: recipiant,
          blockNum: blockResp.blockNum,
          dataHash: blockResp.dataHash,
          description:
            recipiant +
            " purchased " +
            amount +
            " " +
            token +
            " from " +
            adminId,
        });

        await tokenEntry
          .save()
          .then((result, error) => {
            console.log("Buy Token transaction recorded.");
          })
          .catch((error) => {
            console.log("ERROR DB", error);
          });

        return res.send(200, {
          status: true,
          message: "Coins have been successfully purchased.",
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
      console.log("Recipient do not exists.");
      return res.send(404, {
        status: false,
        message: `Recipient do not exists.`,
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
