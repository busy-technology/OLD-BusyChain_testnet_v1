const User = require("../../models/Users");
const config = require("../../../blockchain/test-scripts/config");
const Admin = require("../../models/admin");


module.exports = async (req, res, next) => {
    const adminId = "busy_network";
    const adminData = await Admin.findOne({ userId: adminId });

    const credentials = {
      certificate: adminData.certificate.credentials.certificate,
      privateKey: adminData.certificate.credentials.privateKey,
    };

    const blockchain_credentials = {
      credentials: credentials,
      mspId: adminData.certificate.mspId,
      type: adminData.certificate.type,
    };

    try {
    const response = await config.UpdateBlocks(adminId, blockchain_credentials);
    const resp = response.chaincodeResponse;
  
    if (resp.success == true) {
        console.log("Blocks have been updated successfully")
        return res.send(200, {
            status: true,
            message: "Blocks have been updated successfully",
            maxBlockNum: resp.data,
        })
    } else {
        console.log("Failed to execute chaincode function");
        return res.send(404, {
        status: false,
        message: resp.message,
        });
    };
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
    });
  };
};
