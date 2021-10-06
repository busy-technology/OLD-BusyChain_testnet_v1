const Admin = require("../../models/admin");
const QueryScript = require("../../../blockchain/test-scripts/queryWallet");

module.exports = async (req, res, next) => {
  try {
    //const userId = req.body.userId;
    const userId = "sample";
    const walletId = req.body.walletId;
    const token = req.body.token;
    const adminId = "busy_network";

    //const user = await User.findOne({ userId: userId });

    // if (user) {
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

    // const wallet = await Wallet.findOne({ userId: userId });
    // console.log("WALLET", wallet);

    // if (wallet == null) {
    //   return res.send(404, {
    //     status: false,
    //     message: `Wallet do not exist.`,
    //   });
    // }

    const response1 = await QueryScript.queryWallet(
      userId,
      blockchain_credentials,
      walletId,
      token
    );
    console.log("RESPONSE 1", response1);
    const response = JSON.parse(response1.chaincodeResponse);
    console.log("DATA 2", response);
    const balance = response.data;
    console.log("BALANCE", response.data);

    if (response.success == true) {
      return res.send(200, {
        status: true,
        message: "Balance fetched",
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
    // } else {
    //   console.log("UserId do not exists.");
    //   return res.send(404, {
    //     status: false,
    //     message: `UserId do not exists.`,
    //   });
    // }
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
      Error: exception.message,
    });
  }
};
