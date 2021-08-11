const User = require("../../models/Users");
const Wallet = require("../../models/Wallets");
const sendMessage = require("../../../blockchain/test-scripts/sendMessage");

module.exports = async (req, res, next) => {
  const sender = req.body.sender;
  const recipient = req.body.recipient;
  const blockchain_credentials = req.body.credentials;

  try {
    const sendUser = await User.findOne({ userId: sender });
    const recUser = await User.findOne({userId: recipient})
    if (sendUser && recUser) {
        const response = await sendMessage.sendMessage(
          sender,
          recipient,
          blockchain_credentials,
        );
        const resp = JSON.parse(response.chaincodeResponse);
        if (resp.success == true) {
           console.log("Message Sent Successfully")
           return res.send(200, {
             status: true,
             message: "Message Sent",
             chaincodeResponse: resp,
           })
        } else {
          console.log("Failed to execute chaincode function");
          return res.send(404, {
            status: false,
            message: resp.message,
          });
        };
    } else {
      if (!sendUser){
        console.log("Sender do not exist.");
        return res.send(404, {
          status: false,
          message: `Sender do not exist.`,
        });
      } else {
        console.log("Recipient do not exist.");
        return res.send(404, {
          status: false,
          message: `Recipient do not exist.`,
        });
      };
    }
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
    });
  };
};
