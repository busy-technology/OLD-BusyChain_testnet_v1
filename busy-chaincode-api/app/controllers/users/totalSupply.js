const User = require("../../models/Users");
const Admin = require("../../models/admin");
const totalSupply = require("../../../blockchain/test-scripts/totalSupply");

module.exports = async (req, res, next) => {
  try {
    const symbol = req.body.symbol;
    const adminId = "admin";
    const userId = "sample";

    // if (user) {
    try {
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

      const response1 = await totalSupply.totalSupply(
        userId,
        blockchain_credentials,
        symbol
      );
      console.log("RESPONSE 1", response1);
      const response = JSON.parse(response1.chaincodeResponse);
      console.log("DATA 2", response);
      const balance = response.data;
      console.log("BALANCE", response.data);

      if (response.success == true) {
        return res.send(200, {
          status: true,
          message: "Total supply fetched.",
          chaincodeResponse: response,
        });
      } else {
        console.log("Failed to execute chaincode function");
        return res.send(404, {
          status: false,
          message: `Failed to execute chaincode function.`,
        });
      }
    } catch (err) {
      console.log("ERROR", err);
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
    });
  }
};
