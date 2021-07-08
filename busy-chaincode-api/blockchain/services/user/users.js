const fs = require("fs");
const crypto = require("crypto");

// SDK imports

const registerUser = require("../../sdk/registerUser");
const enrollAdmin = require("../../sdk/enrollAdmin");
const invoke = require("../../sdk/invoke");

exports.RegisterUsers = async (userData, mnemonic) => {
  try {
    await enrollAdmin.FabricAdminEnroll();
    const key = mnemonic;
    console.log("MNEMONIC", key);
    const userRegistered = await registerUser.FabricUserRegister(userData, key);
    if (userRegistered) {
      const invokeChaincode = await invoke.FabricChaincodeInvoke(
        "busychannel",
        "busytoken",
        "CreateUser",
        userData
      );

      if (invokeChaincode) {
        // function to remove the user key

        await invoke.removeKeyFromWallet(userData.userId);
        return {
          userRegistered: userRegistered,
          chaincodeResponse: invokeChaincode,
        };
      }
    }
  } catch (exception) {
    return exception;
  }
};