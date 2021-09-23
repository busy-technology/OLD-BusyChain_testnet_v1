const UserServices = require("../services/user/users");

//const sendResponse = require('../middleware/requestHandler');

exports.vestingV1 = async (
  userId,
  userKey,
  recipient,
  amount,
  numerator,
  denominator,
  releaseAt
) => {
  try {
    const walletDetails = {
      recipient: recipient,
      amount: amount,
      numerator: numerator,
      denominator: denominator,
      releaseAt: releaseAt,
    };
    const data = await UserServices.vesting1(walletDetails, userId, userKey);

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
