const User = require("../../models/Users");
const Wallet = require("../../models/Wallets");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");

module.exports = async (req, res, next) => {
  const userId = req.body.userId,
    blockchain_credentials = req.body.credentials;

  const user = await User.findOne({ userId: userId });
  console.log("User", user);
  if (user) {
    const wallet = await Wallet.findOne({ userId: userId });
    if (wallet) {
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
    } else {
      console.log("Wallet do not exists.");
      return res.send(404, {
        status: false,
        message: `Wallet do not exists.`,
      });
    }
  } else {
    console.log("UserId do not exists.");
    return res.send(404, {
      status: false,
      message: `UserId do not exists.`,
    });
  }
};
