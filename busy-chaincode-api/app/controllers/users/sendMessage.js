const User = require("../../models/Users");
const sendMessage = require("../../../blockchain/test-scripts/sendMessage");
const config = require("../../../blockchain/test-scripts/config");
const sendMessageTransactions = require("../../models/sendmessage");
const bs58 = require("bs58");

const {
  Certificate
} = require("@fidm/x509");

module.exports = async (req, res, next) => {
  const sender = req.body.sender;
  const recipient = req.body.recipient;
  const blockchain_credentials = req.body.credentials;

  try {
    const sendUser = await User.findOne({ walletId: sender });
    const recUser = await User.findOne({walletId: recipient})
    if (sendUser && recUser) {
      const commanName = Certificate.fromPEM(
        Buffer.from(blockchain_credentials.credentials.certificate, "utf-8")
      ).subject.commonName;
      console.log("CN", commanName);
      if (sendUser.userId != commanName) {
        return res.send(404, {
          status: false,
          message: `This certificate is not valid.`,
        });
      }

      if (
        blockchain_credentials.type != "X.509" ||
        blockchain_credentials.mspId != "BusyMSP"
      ) {
        console.log("type of certificate incorrect.");
        return res.send(404, {
          status: false,
          message: `Incorrect type or MSPID.`,
        });
      }

      const decodedPrivateKey = bs58.decode(
        blockchain_credentials.credentials.privateKey
      );

      blockchain_credentials.credentials.privateKey =
        decodedPrivateKey.toString();

        const response = await sendMessage.sendMessage(
          sendUser.userId,
          recUser.userId,
          blockchain_credentials,
        );
        const resp = JSON.parse(response.chaincodeResponse);
        if (resp.success == true) {
           console.log("Message Sent Successfully")

           // Storing the data from the blockchain
           await User.updateOne({walletId: sender}, {messageCoins: resp.data.Sender})
           await User.updateOne({walletId: recipient}, {messageCoins: resp.data.Recipient})
           const blockResponse = await config.GetBlockFromTransactionId(sendUser.userId, blockchain_credentials, resp.txId);
           const blockResp = blockResponse.chaincodeResponse;
           const sendMessageEntry = await new sendMessageTransactions({
             sender:sender,
             recipient: recipient,
             tokenName: "BUSY",
             function: "SendMessage",
             txId: resp.txId,
             blockNum: blockResp.blockNum,
             dataHash: blockResp.dataHash,     
             createdDate: new Date(blockResp.timestamp),
           });
   
           await sendMessageEntry
             .save()
             .then((result, error) => {
               console.log("Send Message transaction recorded.");
             })
             .catch((error) => {
               console.log("ERROR DB", error);
             });
   

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
        console.log("Sender WalletId do not exist.");
        return res.send(404, {
          status: false,
          message: `Sender do not exist.`,
        });
      } else {
        console.log("Recipient WalletId do not exist.");
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
