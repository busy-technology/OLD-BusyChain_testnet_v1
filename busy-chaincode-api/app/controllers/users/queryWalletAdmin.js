const User = require("../../models/Users");
const Admin = require("../../models/admin");
const Wallet = require("../../models/Wallets");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");

module.exports = async (req, res, next) => {
  const userId = req.body.userId;
  const adminId = "admin";

  const user = await User.findOne({ userId: userId });

  if (user) {
    try {
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

      console.log("BLOCK", blockchain_credentials);

      const wallet = await Wallet.findOne({ userId: userId });

      const response = await QueryScript.queryWallet(
        userId,
        blockchain_credentials,
        wallet.walletId
      );
      console.log("DATA 2", response.chaincodeResponse);
      const balance = response.chaincodeResponse.data;
      console.log("BALANCE", response.chaincodeResponse.data);

      if (response.chaincodeResponse.success == true) {
        return res.send(200, {
          status: true,
          message: "Balance fetched",
          chaincodeResponse: response.chaincodeResponse,
        });
      } else {
        console.log("Failed to execute chaincode function");
        return res.send(404, {
          status: false,
          message: `Failed to execute chaincode function.`,
        });
      }
    } catch (err) {
      console.log("ERROR", err);
    }
  } else {
    console.log("UserId do not exists.");
    return res.send(404, {
      status: false,
      message: `UserId do not exists.`,
    });
  }
};
