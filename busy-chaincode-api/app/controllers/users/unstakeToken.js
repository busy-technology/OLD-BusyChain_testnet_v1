const User = require("../../models/Users");
const Wallet = require("../../models/Wallets");
const { Certificate } = require("@fidm/x509");

const unstakeScript = require("../../../blockchain/test-scripts/unstake");

module.exports = async (req, res, next) => {
  try {
    const stakingAddr = req.body.stakingAddr,
      blockchain_credentials = req.body.credentials;

    const address = await Wallet.findOne({
      walletId: stakingAddr,
    });
    console.log("ADDRESS", address);

    if (address) {
      const user = await User.findOne({ userId: address.userId });
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

        const response1 = await unstakeScript.unstakeToken(
          user.userId,
          blockchain_credentials,
          stakingAddr
        );
        console.log("RESPONSE 1", response1);
        const response = JSON.parse(response1.chaincodeResponse);
        console.log("CHECK", response);
        console.log("DATA 2", response);
        const txId = response.txId;
        console.log("TRANSACTION ID", txId);

        if (response.success == true) {
          return res.send(200, {
            status: true,
            message: "Unstaking successful.",
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
        console.log("User having this stakking address not found.");
        return res.send(404, {
          status: false,
          message: `User having this stakking address not found.`,
        });
      }
    } else {
      console.log("stakingAddr do not exists.");
      return res.send(404, {
        status: false,
        message: `stakingAddr do not exists`,
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
