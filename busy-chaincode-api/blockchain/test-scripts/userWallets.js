const UserServices = require("../services/user/users");
//const sendResponse = require('../middleware/requestHandler');

exports.queryWallet = async (userId, userKey, wallet) => {
  try {
    const walletID = wallet;
    console.log("UserKey", userKey);
    console.log("UserId", userId);
    const data = await UserServices.UserQuery(userId, userKey);

    console.log("DATA", data);

    if (data) {
      const output = {
        chaincodeResponse: data,
      };
      return output;
    } else {
      //   return sendResponse(res, false, 200, txId, 'User already exists');
      console.log("error");
    }
  } catch (exception) {
    //logger.error(exception.errors);
    //return sendResponse(res, false, 200, exception.errors);
    console.log("exception", exception);
  }
};
