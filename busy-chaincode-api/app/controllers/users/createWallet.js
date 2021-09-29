const User = require("../../models/Users");
const Wallet = require("../../models/Wallets");
const { Certificate } = require("@fidm/x509");
const WalletScript = require("../../../blockchain/test-scripts/walletCreate");
const config = require("../../../blockchain/test-scripts/config");
const bs58 = require("bs58");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId,
      blockchain_credentials = req.body.credentials,
      type = req.body.type;
    console.log("TYPE", type);

    const user = await User.findOne({ userId: userId });
    console.log("User", user);
    if (user) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchain_credentials.credentials.certificate, "utf-8")
      ).subject.commonName;
      console.log("CN", commanName);
      if (userId != commanName) {
        return res.send(404, {
          status: false,
          message: `401: This certificate is not valid.`,
        });
      }

      if (type == "online" || type == "offline" || type == "staking") {
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

        console.log(
          "PRIVATE KEY",
          blockchain_credentials.credentials.privateKey
        );

        // const decodedPrivateKey = base58.decode(
        //   blockchain_credentials.credentials.privateKey
        // );
        const decodedPrivateKey = bs58.decode(
          blockchain_credentials.credentials.privateKey
        );

        console.log("DECODED KEY", decodedPrivateKey.toString());

        blockchain_credentials.credentials.privateKey =
          decodedPrivateKey.toString();

        const response1 = await WalletScript.WalletCreation(
          userId,
          blockchain_credentials
        );
        const response = JSON.parse(response1.chaincodeResponse);
        const stakingWalletId = response.data.stakingAddr;
        const txId = response.txId;
        console.log("WalletId", stakingWalletId);
        console.log("TRANSACTION ID", txId);

        if (response.success == true) {
          const blockResponse = await config.GetBlockFromTransactionId(
            user.userId,
            blockchain_credentials,
            response.txId
          );
          const blockResp = blockResponse.chaincodeResponse;
          const wallet = await new Wallet({
            userId: userId,
            stakingWalletId: stakingWalletId,
            walletId: user.walletId,
            type: type,
            txId: response.txId,
            blockNum: blockResp.blockNum,
            dataHash: blockResp.dataHash,
            createdDate: new Date(blockResp.timestamp),
            amount: response.data.amount,
            totalReward: response.data.totalReward,
            claimed: response.data.claimed
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
            chaincodeResponse: stakingWalletId,
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
        console.log("Incorrect type of wallet.");
        return res.send(404, {
          status: false,
          message: `Incorrect type of wallet.`,
        });
      }
    } else {
      console.log("UserId do not exists.");
      return res.send(404, {
        status: false,
        message: `UserId do not exists.`,
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
