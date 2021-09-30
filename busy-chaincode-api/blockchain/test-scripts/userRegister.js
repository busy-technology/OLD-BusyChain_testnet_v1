const UserServices = require("../services/user/users");
// bip129 algorith
const bip39 = require("bip39");

//const sendResponse = require('../middleware/requestHandler');
exports.registerUsers = async (userId) => {
  try {
    const userData = {
      userId: userId,
    };
    console.log("userData", userData);
    const mnemonic = bip39.generateMnemonic();
    const data = await UserServices.RegisterUsers(userData, mnemonic);

    console.log("DATA 1", data);

    if (data) {
      const blockchain_credentials = JSON.parse(
        JSON.stringify(data.userRegistered)
      );
      const response = JSON.parse(data.chaincodeResponse);

      //   GIVE ALL THE CONSOLES IN RESPONSE OF API

      console.log("chaincodeResponse", response);
      console.log("MNEMONIC GENERATED", mnemonic);

      const output = {
        blockchain_credentials: blockchain_credentials,
        chaincodeResponse: response,
        seed: mnemonic,
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

// registerUsers("vbvjbjdhbjd786767");
