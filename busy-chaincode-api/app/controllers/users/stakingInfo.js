const Admin = require("../../models/admin");
const User = require("../../models/Users");
const staking = require("../../../blockchain/test-scripts/staking-info");

module.exports = async (req, res, next) => {
  try {
    const userIdentity = req.body.userId;
    const adminId = "busy_network";
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

    const id = await User.findOne({
      userId: userIdentity,
    });
    //console.log("ADDRESS", address);

    if (id) {
      const response1 = await staking.stakingInfo(
        userId,
        blockchain_credentials,
        userIdentity
      );
      console.log("RESPONSE 1", response1);
      const response = JSON.parse(response1.chaincodeResponse);
      console.log("DATA 2", response);
      const balance = response.data;
      console.log("BALANCE", response.data);

      if (response.success == true) {
        return res.send(200, {
          status: true,
          message: "Staking Info fetched.",
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
      console.log("userId do not exists.");
      return res.send(404, {
        status: false,
        message: `userId do not exists`,
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
