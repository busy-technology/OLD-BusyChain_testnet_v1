const User = require("../../models/Users");
const {
  Certificate
} = require("@fidm/x509");
const IssuetokenTransactions = require("../../models/issued-tokens");
const IssueToken = require("../../../blockchain/test-scripts/issueTokens");
const config = require("../../../blockchain/test-scripts/config");
const bs58 = require("bs58");
const constants = require("../../../constants");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");

module.exports = async (req, res, next) => {
  try {
    const walletId = req.body.walletId,
      blockchain_credentials = req.body.credentials,
      tokenName = req.body.tokenName,
      symbol = req.body.symbol,
      amount = req.body.amount,
      decimals = req.body.decimals;

    console.log("TokenName", tokenName);
    console.log("Symbol", symbol);

    const user = await User.findOne({
      walletId: walletId
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
      const lowerTokenName = tokenName.toLowerCase();
      console.log("lowerTokenName", lowerTokenName);
      const lowerToken = symbol.toLowerCase();
      console.log("LOWER TOKEN", lowerToken);
      const coinSymbol = await IssuetokenTransactions.findOne({
        symbol: lowerToken,
      });
      console.log("COIN", coinSymbol);
      const coinName = await IssuetokenTransactions.findOne({
        name: lowerTokenName,
      });
      console.log("COIN", coinName);
      if (!coinName) {
        if (!coinSymbol) {
          const decodedPrivateKey = bs58.decode(
            blockchain_credentials.credentials.privateKey
          );

          blockchain_credentials.credentials.privateKey =
            decodedPrivateKey.toString();

          const response1 = await IssueToken.issueToken(
            walletId,
            blockchain_credentials,
            tokenName,
            symbol,
            amount,
            decimals
          );
          console.log("RESPONSE 1", response1);
          const response = JSON.parse(response1.chaincodeResponse);
          console.log("CHECK", response);
          console.log("DATA 2", response);
          const txId = response.txId;
          console.log("TRANSACTION ID", txId);

          if (response.success == true) {
            const blockResponse = await config.GetBlockFromTransactionId(
              user.userId,
              blockchain_credentials,
              txId
            );
            const blockResp = blockResponse.chaincodeResponse;
            console.log("blockresp", blockResp);
            const tokenEntry = await new IssuetokenTransactions({
              tokenName: tokenName,
              name: response.data.tokenName,
              amount: amount,
              tokenSymbol: response.data.tokenSymbol,
              symbol: response.data.tokenSymbol,
              tokenAdmin: response.data.admin,
              tokenId: response.data.id,
              tokenSupply: response.data.totalSupply,
              tokendeciamls: response.data.decimals,
              function: "Issue Tokens",
              txId: txId,
              blockNum: blockResp.blockNum,
              dataHash: blockResp.dataHash,
              sender: "Busy network",
              receiver: walletId,
              createdDate: new Date(blockResp.timestamp),
              description: user.userId +
                " issued " +
                amount +
                " " +
                tokenName +
                " with symbol " +
                symbol,
              logoPath: "",
              websiteUrl: "",
              socialMedia: "",
            });

            await tokenEntry
              .save()
              .then((result, error) => {
                console.log("Issue Tokens transaction recorded.");
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
      

            return res.send(200, {
              status: true,
              message: "Tokens issued.",
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
          console.log("Coin symbol already taken.");
          return res.send(404, {
            status: false,
            message: `Coin symbol already exists.`,
          });
        }
      } else {
        console.log("Coin Name already taken.");
        return res.send(404, {
          status: false,
          message: `Coin Name already taken.`,
        });
      }
    } else {
      console.log("WalletId do not exists.");
      return res.send(404, {
        status: false,
        message: `WalletId do not exists.`,
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