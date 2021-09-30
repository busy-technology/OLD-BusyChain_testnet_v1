const User = require("../../models/Users");
const Admin = require("../../models/admin");
const transactionFeeService = require("../../../blockchain/test-scripts/transactionsFees");

module.exports = async (req, res, next) => {
  try {
    const newTransferFee = req.body.newTransferFee;
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

    const response1 = await transactionFeeService.transactionFees(
      userId,
      blockchain_credentials,
      newTransferFee
    );
    console.log("RESPONSE 1", response1);
    const response = JSON.parse(response1.chaincodeResponse);
    console.log("DATA 2", response);
    const balance = response.data;
    console.log("BALANCE", response.data);

    if (response.success == true) {
      return res.send(200, {
        status: true,
        message: "Transaction fees updated.",
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
