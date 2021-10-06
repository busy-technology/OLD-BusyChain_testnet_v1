const User = require("../../models/Users");
const Wallet = require("../../models/Wallets");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");
const bs58 = require("bs58");

module.exports = async (req, res, next) => {
  const userId = req.body.userId,
    blockchain_credentials = req.body.credentials;

  const user = await User.findOne({ userId: userId });
  console.log("User", user);
  if (user) {
    const wallet = await Wallet.findOne({ userId: userId });
    if (wallet) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchain_credentials.credentials.certificate, "utf-8")
      ).subject.commonName;
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
          message: "Balance has been successfully fetched",
          chaincodeResponse: response.chaincodeResponse,
        });
      } else {
        console.log("Failed to execute chaincode function");
        return res.send(404, {
          status: false,
          message: `Failed to execute chaincode function`,
        });
      }
    } else {
      console.log("Wallet does not exist");
      return res.send(404, {
        status: false,
        message: `Wallet does not exist`,
      });
    }
  } else {
    console.log("User does not exist");
    return res.send(404, {
      status: false,
      message: `User does not exist`,
    });
  }
};
