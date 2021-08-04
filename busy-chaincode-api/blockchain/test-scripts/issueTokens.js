const UserServices = require("../services/user/users");

//const sendResponse = require('../middleware/requestHandler');

const issueToken = async (userId, userKey, tokenName, symbol, amount) => {
  try {
    console.log("USER KEY", userKey);
    const data = await UserServices.issueToken(
      userId,
      userKey,
      tokenName,
      symbol,
      amount
    );

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

issueToken()
