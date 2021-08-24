const User = require("../../models/Users");
const Wallet = require("../../models/Wallets");
const { Certificate } = require("@fidm/x509");
const WalletScript = require("../../../blockchain/test-scripts/walletCreate");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId,
      blockchain_credentials = req.body.credentials,
      type = req.body.type;
    console.log("TYPE", type);

    const commanName = Certificate.fromPEM(
      Buffer.from(blockchain_credentials.credentials.certificate, "utf-8")
    ).subject.commonName;
    console.log("CN", commanName);

    if (userId != commanName) {
      return res.send(404, {
        status: false,
        message: `This certificate is not valid.`,
      });
    }

    if (type == "online" || type == "offline") {
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
      const user = await User.findOne({ userId: userId });
      console.log("User", user);
      if (user) {
        const response1 = await WalletScript.WalletCreation(
          userId,
          blockchain_credentials
        );
        console.log("RESPONSE 1", response1);
        const response = JSON.parse(response1.chaincodeResponse);
        console.log("CHECK", response);
        console.log("DATA 2", response);
        const walletId = response.data;
        const txId = response.txId;
        console.log("WalletId", walletId);
        console.log("TRANSACTION ID", txId);

        if (response.success == true) {
          const wallet = await new Wallet({
            userId: userId,
            walletId: walletId,
            type: type,
            txId: response.txId,
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
        console.log("UserId do not exists.");
        return res.send(404, {
          status: false,
          message: `UserId do not exists.`,
        });
      }
    } else {
      console.log("Incorrect type of wallet.");
      return res.send(404, {
        status: false,
        message: `Incorrect type of wallet.`,
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
