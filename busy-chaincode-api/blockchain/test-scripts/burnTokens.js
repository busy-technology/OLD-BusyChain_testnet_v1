const UserServices = require("../services/user/users");

//const sendResponse = require('../middleware/requestHandler');

exports.burnTokens = async (userId, userKey, address, amount, symbol) => {
  try {
    console.log("USER KEY", userKey);
    const walletDetails = {
      address: address,
      amount: amount,
      symbol: symbol,
    };
    const data = await UserServices.burnTokens(walletDetails, userId, userKey);

    console.log("DATA", data);

    if (data) {
      //const response = JSON.parse(data.chaincodeResponse);
      //console.log("RESPONSE FROM CHAINCODE", response);
      const output = {
        chaincodeResponse: data,
      };
      console.log("OUTPUT", output);
      return output;
    } else {
      const output = {
        chaincodeResponse: exception.message,
      };
      return output;
    }
  } catch (exception) {
    //logger.error(exception.errors);
    //return sendResponse(res, false, 200, exception.errors);
    console.log("exception", exception);
  }
};
