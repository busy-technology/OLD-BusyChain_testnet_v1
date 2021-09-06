const User = require("../../models/Users");
const voting = require("../../../blockchain/test-scripts/voting");

module.exports = async (req, res, next) => {
  const votingInfo = req.body.votingInfo;
  const userId = req.body.userId;
  const blockchain_credentials = req.body.credentials;
  try {
    const user = await User.findOne({ userId: userId });
    const response = await voting.CreatePool(userId, blockchain_credentials, votingInfo);
    const resp = JSON.parse(response.chaincodeResponse);
    if (resp.success == true) {
        console.log("Pool Created Successfully")
        return res.send(200, {
            status: true,
            message: "Pool Created Successfully",
            chaincodeResponse: resp,
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
