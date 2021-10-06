const User = require("../../models/Users");
const { Certificate } = require("@fidm/x509");
const attemptUnlockScript = require("../../../blockchain/test-scripts/attemptUnlock");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");
const bs58 = require("bs58");
const constants = require("../../../constants");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.walletId,
      blockchain_credentials = req.body.credentials;

    const user = await User.findOne({ walletId: userId });
    console.log("User", user);
    if (user) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchain_credentials.credentials.certificate, "utf-8")
      ).subject.commonName;
      console.log("CN", commanName);
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

      const response1 = await attemptUnlockScript.AttemptUnlock(
        userId,
        blockchain_credentials
      );
      console.log("RESPONSE 1", response1);
      const response = JSON.parse(response1.chaincodeResponse);

      console.log("DATA 2", response);
      const txId = response.txId;
      console.log("TRANSACTION ID", txId);

      if (response.success == true) {
        const balanceResponse = await QueryScript.queryWallet(
          user.userId,
          blockchain_credentials,
          user.walletId,
          constants.BUSY_TOKEN
        );
        const balanceResp = JSON.parse(balanceResponse.chaincodeResponse);
        await User.updateOne(
          {
            walletId: user.walletId,
          },
          {
            $set: {
              walletBalance: balanceResp.data,
            },
          }
        )
          .exec()
          .then((doc) => {
            console.log(
              "Updating Default wallet Balance for " +
                user.walletId +
                " setting amount to " +
                balanceResp.data
            );
          })
          .catch((err) => {
            console.log(err);
            throw new Error(err);
          });

        return res.send(200, {
          status: true,
          message: "Coins have been successfully unlocked from the vesting",
          chaincodeResponse: response,
        });
      } else {
        console.log("Failed to execute chaincode function");
        return res.send(404, {
          status: false,
          message: `Failed to execute chaincode function`,
          chaincodeResponse: response,
        });
      }
    } else {
      console.log("Wallet does not exist");
      return res.send(404, {
        status: false,
        message: `Wallet does not exist`,
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
