const Admin = require("../../models/admin");
const lockedTokensInfo = require("../../../blockchain/test-scripts/getLockedTokens");

module.exports = async (req, res, next) => {
  try {
    const address = req.body.address;
    // const addressString = address.toString();
    // console.log("address", addressString);
    const adminId = "admin";
    const userId = "sample";

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

    const response1 = await lockedTokensInfo.getLockedTokens(
      userId,
      blockchain_credentials,
      address
    );
    console.log("RESPONSE 1", response1);
    const response = JSON.parse(response1.chaincodeResponse);
    console.log("DATA 2", response);
    const balance = response.data;
    console.log("BALANCE", response.data);

    if (response.success == true) {
      return res.send(200, {
        status: true,
        message: "Locked tokens fetched.",
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
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
      Error: exception.message,
    });
  }
};
