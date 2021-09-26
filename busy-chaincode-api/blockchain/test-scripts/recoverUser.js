const UserServices = require("../services/user/users");
// bip129 algorith

//const sendResponse = require('../middleware/requestHandler');

exports.recoverUsers = async (userId, mnemonic) => {
  try {
    const userData = {
      userId: userId,
      mnemonic: mnemonic,
    };

    console.log("MNEMONIC SENT", userData.mnemonic);

    const data = await UserServices.RecoverUsers(userData);

    if (data) {
      const blockchain_credentials = JSON.parse(
        JSON.stringify(data.userRegistered)
      );

      const output = {
        blockchain_credentials: blockchain_credentials,
      };
      return output;
    } else {
      //   //   return sendResponse(res, false, 200, txId, 'User already exists');
      console.log("error");
    }
  } catch (exception) {
    throw (exception);
  }
};

// recoverUsers(
//   "mark@busy6",
//   "mind demand sight acid kangaroo husband trigger minute toddler flight ugly drastic"
// );