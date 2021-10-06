const User = require("../../models/Users");
const Wallet = require("../../models/Wallets");
const {
  Certificate
} = require("@fidm/x509");
const unstakeTransactions = require("../../models/unstakeTransactions");
const config = require("../../../blockchain/test-scripts/config");

const unstakeScript = require("../../../blockchain/test-scripts/unstake");
const bs58 = require("bs58");
const constants = require("../../../constants");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");

module.exports = async (req, res, next) => {
  try {
    const stakingAddr = req.body.stakingAddr,
      blockchain_credentials = req.body.credentials;

    const address = await Wallet.findOne({
      stakingWalletId: stakingAddr,
    });
    console.log("ADDRESS", address);

    if (address) {
      const user = await User.findOne({
        userId: address.userId
      });
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
          const blockResponse = await config.GetBlockFromTransactionId(user.userId, blockchain_credentials, response.txId);
          const blockResp = blockResponse.chaincodeResponse;

          const unstakeEntry = await new unstakeTransactions({
            tokenName: "BUSY",
            amount: response.data.amount,
            totalReward: response.data.totalReward,
            claimed: response.data.claimed,
            txId: response.txId,
            blockNum: blockResp.blockNum,
            dataHash: blockResp.dataHash,
            createdDate: new Date(blockResp.timestamp),
            walletId: response.data.defaultWalletAddress,
            stakingWalletId: response.data.stakingAddr,
          });

          await unstakeEntry
            .save()
            .then((result, error) => {
              console.log(" Transaction Recorded");
            })
            .catch((error) => {
              console.log("ERROR DB", error);
            });

            const balanceResponse = await QueryScript.queryWallet(
              user.userId,
              blockchain_credentials,
              user.walletId,
              constants.BUSY_TOKEN
            );
            const balanceResp = JSON.parse(balanceResponse.chaincodeResponse);
            await User.updateOne({
              walletId: user.walletId
            }, {
              "$set": {
                "walletBalance": balanceResp.data
              }
            }).exec().then(doc => {
              console.log('Updating Default wallet Balance for ' + user.walletId + ' setting amount to ' + balanceResp.data);
            }).catch(err => {
              console.log(err);
              throw new Error(err);
            });
    
          await Wallet.updateOne({
            stakingWalletId: address.stakingWalletId
          }, {
            amount: "0",
            totalReward: response.data.totalReward,
            claimed: response.data.claimed
          });

          return res.send(200, {
            status: true,
            message: "Staking address has been successfully unstaked",
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
        console.log("User does not own this staking address");
        return res.send(404, {
          status: false,
          message: `User does not own this staking address`,
        });
      }
    } else {
      console.log("Staking address does not exist");
      return res.send(404, {
        status: false,
        message: `Staking address does not exist`,
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