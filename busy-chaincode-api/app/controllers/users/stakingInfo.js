const Admin = require("../../models/admin");
const Wallet = require("../../models/Wallets");
const staking = require("../../../blockchain/test-scripts/staking-info");

module.exports = async (req, res, next) => {
  try {
    const stakingAddr = req.body.stakingAddr;
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

    const address = await Wallet.findOne({
      walletId: stakingAddr,
    });
    console.log("ADDRESS", address);

    if (address) {
      const response1 = await staking.stakingInfo(
        userId,
        blockchain_credentials,
        stakingAddr
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
      console.log("stakingAddr do not exists.");
      return res.send(404, {
        status: false,
        message: `stakingAddr do not exists`,
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
