const User = require("../../models/Users");
const { Certificate } = require("@fidm/x509");
const tokenTransactions = require("../../models/token-transactions");
const transferScript = require("../../../blockchain/test-scripts/transferTokens");

module.exports = async (req, res, next) => {
  try {
    const sender = req.body.sender,
      blockchain_credentials = req.body.credentials,
      recipiant = req.body.recipiant,
      amount = req.body.amount,
      token = req.body.token;

    const user = await User.findOne({ walletId: sender });
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
      const response1 = await transferScript.transferToken(
        sender,
        blockchain_credentials,
        recipiant,
        amount,
        token
      );
      console.log("RESPONSE 1", response1);
      const response = JSON.parse(response1.chaincodeResponse);
      console.log("CHECK", response);
      console.log("DATA 2", response);
      const txId = response.txId;
      console.log("TRANSACTION ID", txId);

      if (response.success == true) {
        const tokenEntry = await new tokenTransactions({
          tokenName: token,
          amount: amount,
          function: "Transfer",
          txId: txId,
          sender: sender,
          receiver: recipiant,
          description:
            sender +
            " transferred " +
            amount +
            " " +
            token +
            " to " +
            recipiant,
        });

        await tokenEntry
          .save()
          .then((result, error) => {
            console.log("Token transfer transaction recorded.");
          })
          .catch((error) => {
            console.log("ERROR DB", error);
          });

        return res.send(200, {
          status: true,
          message:
            sender +
            " transferred " +
            amount +
            " " +
            token +
            " to " +
            recipiant,
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
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
      Error: exception.message,
    });
  }
};
