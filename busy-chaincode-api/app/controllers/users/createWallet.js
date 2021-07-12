const User = require("../../models/Users");
const Wallet = require("../../models/Wallets");
const WalletScript = require("../../../blockchain/test-scripts/walletCreate");

module.exports = async (req, res, next) => {
  const userId = req.body.userId,
    blockchain_credentials = req.body.credentials;

  const user = await User.findOne({ userId: userId });
  console.log("User", user);
  if (user) {
    const response = await WalletScript.WalletCreation(
      userId,
      blockchain_credentials
    );
    console.log("DATA 2", response.chaincodeResponse);
    const walletId = response.chaincodeResponse.data;
    console.log("WalletId", response.chaincodeResponse.data);

    if (response.chaincodeResponse.success == true) {
      const wallet = await new Wallet({
        userId: userId,
        walletId: walletId,
        txId: response.chaincodeResponse.txId,
      });

      await wallet
        .save()
        .then((result, error) => {
          console.log("Wallet saved.");
        })
        .catch((error) => {
          console.log("ERROR DB", error);
        });

      return res.send(200, {
        status: true,
        message: "Wallet created.",
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
    console.log("UserId do not exists.");
    return res.send(404, {
      status: false,
      message: `UserId do not exists.`,
    });
  }
};
