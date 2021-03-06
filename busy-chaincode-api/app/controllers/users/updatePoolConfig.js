const User = require("../../models/Users");
const voting = require("../../../blockchain/test-scripts/voting");
const Admin = require("../../models/admin");

module.exports = async (req, res, next) => {
  const adminId = "busy_network";
  const adminData = await Admin.findOne({ userId: adminId });
  const minimumCoins = req.body.minimumCoins;
  const poolFee = req.body.poolFee;
  const votingPeriod = req.body.votingPeriod;
  const votingStartTime = req.body.votingStartTime;
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
    const user = await User.findOne({ userId: adminId });
    const response = await voting.UpdatePoolConfig(
      adminId,
      blockchain_credentials,
      minimumCoins,
      poolFee,
      votingPeriod,
      votingStartTime
    );
    const resp = JSON.parse(response.chaincodeResponse);
    if (resp.success == true) {
      console.log("Voting configuration has been successfully updated");
      return res.send(200, {
        status: true,
        message: "Voting configuration has been successfully updated",
        chaincodeResponse: resp,
      });
    } else {
      console.log("Failed to execute chaincode function");
      return res.send(404, {
        status: false,
        message: resp.message,
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
