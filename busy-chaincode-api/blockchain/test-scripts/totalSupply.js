const UserServices = require("../services/user/users");

//const sendResponse = require('../middleware/requestHandler');

exports.totalSupply = async (userId, userKey, symbol) => {
  try {
    console.log("USER KEY", userKey);
    const walletDetails = {
      symbol: symbol,
    };
    const data = await UserServices.totalSupply(walletDetails, userId, userKey);

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
