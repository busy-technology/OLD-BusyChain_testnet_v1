const messenger = require("../services/user/messenger");
//const sendResponse = require('../middleware/requestHandler');

exports.sendMessage = async (sender,recipient,userKey) => {
  try {

    console.log("Recieved a Message from", sender);

    const data = await messenger.SendMessage(sender, recipient, userKey);


    if (data) {
      console.log("RESPONSE FROM CHAINCODE", data);
      const output = {
        chaincodeResponse: data,
      };
      return output;
    } else {
      console.log("error");
    }
  } catch (exception) {
    //logger.error(exception.errors);
    //return sendResponse(res, false, 200, exception.errors);
    console.log("exception", exception);
  }
};