const fs = require("fs");
const crypto = require("crypto");

// SDK imports

const registerUser = require("../../sdk/registerUser");
const enrollAdmin = require("../../sdk/enrollAdmin");
const invoke = require("../../sdk/invoke");
const query = require("../../sdk/query");

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

exports.CreateWallet = async (userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "CreateWallet",
        "",
        userId,
        userKey
      );

    if (invokeFabricChaincodeWithCertificate) {
      // function to remove the user key

      await invoke.removeKeyFromWallet(userId);
      return {
        chaincodeResponse: invokeFabricChaincodeWithCertificate,
      };
    }
  } catch (exception) {
    return { error: exception };
  }
};

exports.WalletQuery = async (walletId, userId, userKey) => {
  try {
    const invokeWalletQuery = await query.ChaincodeQuery(
      "busychannel",
      "busytoken",
      "GetBalance",
      walletId,
      userId,
      userKey
    );

    if (invokeWalletQuery) {
      await invoke.removeKeyFromWallet(userId);
      return {
        chaincodeResponse: invokeWalletQuery,
      };
    }
  } catch (exception) {
    return { error: exception };
  }
};
