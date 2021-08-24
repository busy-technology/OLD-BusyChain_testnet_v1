const Admin = require("../../models/admin");
const vestingTransactions = require("../../models/vesting2");
const vestingV2 = require("../../../blockchain/test-scripts/vestingV2");

module.exports = async (req, res, next) => {
  try {
    const recipient = req.body.recipient,
      amount = req.body.amount,
      startAt = req.body.startAt,
      releaseAt = req.body.releaseAt,
      adminId = "ordererAdmin",
      userId = "sample";

    console.log("IN USER");
    const adminData = await Admin.findOne({ userId: adminId });
    console.log("ADMIN", adminData);

    const credentials = {
      certificate: adminData.certificate.credentials.certificate,
      privateKey: adminData.certificate.credentials.privateKey,
    };

    const blockchain_credentials = {
      credentials: credentials,
      mspId: adminData.certificate.mspId,
      type: adminData.certificate.type,
    };

    console.log("BLOCK", blockchain_credentials);

    const response1 = await vestingV2.vestingV2(
      userId,
      blockchain_credentials,
      recipient,
      amount,
      startAt,
      releaseAt
    );
    console.log("RESPONSE 1", response1);
    const response = JSON.parse(response1.chaincodeResponse);
    console.log("DATA 2", response);
    const txId = response.txId;
    console.log("TRANSACTION ID", txId);

    if (response.success == true) {
      const vestingEntry = await new vestingTransactions({
        recipient: recipient,
        amount: amount,
        startAt: startAt,
        releaseAt: releaseAt,
        txId: txId,
      });

      await vestingEntry
        .save()
        .then((result, error) => {
          console.log("Vest token transaction recorded.");
        })
        .catch((error) => {
          console.log("ERROR DB", error);
        });

      return res.send(200, {
        status: true,
        message: "Tokens vested.",
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
  } catch (exception) {
    console.log("EXCEPTION", exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
      Error: exception.message,
    });
  }
};
