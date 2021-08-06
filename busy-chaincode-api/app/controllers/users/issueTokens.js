const User = require("../../models/Users");
const { Certificate } = require("@fidm/x509");
const tokenTransactions = require("../../models/token-transactions");
const IssueToken = require("../../../blockchain/test-scripts/issueTokens");

module.exports = async (req, res, next) => {
  try {
    const walletId = req.body.walletId,
      blockchain_credentials = req.body.credentials,
      tokenName = req.body.tokenName,
      symbol = req.body.symbol,
      amount = req.body.amount;

    const user = await User.findOne({ walletId: walletId });
    console.log("User", user);

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

    if (user) {
      const response1 = await IssueToken.issueToken(
        walletId,
        blockchain_credentials,
        tokenName,
        symbol,
        amount
      );
      console.log("RESPONSE 1", response1);
      const response = JSON.parse(response1.chaincodeResponse);
      console.log("CHECK", response);
      console.log("DATA 2", response);
      const txId = response.txId;
      console.log("TRANSACTION ID", txId);

      if (response.success == true) {
        const tokenEntry = await new tokenTransactions({
          tokenName: tokenName,
          amount: amount,
          function: "Issue Tokens",
          txId: txId,
          sender: "Busy network",
          receiver: user.userId + " with address " + walletId,
          description:
            user.userId +
            " issued " +
            amount +
            " " +
            tokenName +
            " with symbol " +
            symbol,
        });

        await tokenEntry
          .save()
          .then((result, error) => {
            console.log("Issue Tokens transaction recorded.");
          })
          .catch((error) => {
            console.log("ERROR DB", error);
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
    });
  }
};
