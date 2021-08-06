const fs = require("fs");
const crypto = require("crypto");

// SDK imports

const registerUser = require("../../sdk/registerUser");
const enrollAdmin = require("../../sdk/enrollAdmin");
const enrollOrdererAdmin = require("../../sdk/enrollOrdererAdmin");
const invoke = require("../../sdk/invoke");
const query = require("../../sdk/query");
const queryUser = require("../../sdk/queryUser");
const recoverUser = require("../../sdk/recoverUser");
const { exception } = require("console");

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
        "CreateStakingAddress",
        "",
        userId,
        userKey
      );

    if (invokeFabricChaincodeWithCertificate) {
      // function to remove the user key

      await invoke.removeKeyFromWallet(userId);
      return invokeFabricChaincodeWithCertificate;
    }
  } catch (exception) {
    console.log("IN CATCH OF CREATE WALLET SERVICE.");
    //return { error: exception };
    return exception;
  }
};

exports.issueToken = async (walletDetails, userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "IssueToken",
        walletDetails,
        userId,
        userKey
      );

    if (invokeFabricChaincodeWithCertificate) {
      // function to remove the user key

      await invoke.removeKeyFromWallet(userId);
      return invokeFabricChaincodeWithCertificate;
    }
  } catch (exception) {
    console.log("IN CATCH OF ISSUE TOKEN SERVICE.");
    //return { error: exception };
    return exception;
  }
};

exports.totalSupply = async (walletDetails, userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "GetTotalSupply",
        walletDetails,
        userId,
        userKey
      );

    if (invokeFabricChaincodeWithCertificate) {
      // function to remove the user key

      await invoke.removeKeyFromWallet(userId);
      return invokeFabricChaincodeWithCertificate;
    }
  } catch (exception) {
    console.log("IN CATCH OF ISSUE TOKEN SERVICE.");
    //return { error: exception };
    return exception;
  }
};

exports.transferToken = async (walletDetails, userId, userKey) => {
  try {
    await enrollOrdererAdmin.FabricAdminEnroll();
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "Transfer",
        walletDetails,
        userId,
        userKey
      );

    if (invokeFabricChaincodeWithCertificate) {
      // function to remove the user key

      await invoke.removeKeyFromWallet(userId);
      return invokeFabricChaincodeWithCertificate;
    }
  } catch (exception) {
    console.log("IN CATCH OF TRANSFER TOKEN SERVICE.");
    //return { error: exception };
    return exception;
  }
};

exports.WalletQuery = async (walletDetails, userId, userKey) => {
  try {
    //await enrollAdmin.FabricAdminEnroll();
    const invokeWalletQuery = await query.ChaincodeQuery(
      "busychannel",
      "busytoken",
      "GetBalance",
      walletDetails,
      userId,
      userKey
    );

    if (invokeWalletQuery) {
      console.log("REMOVING KEY FROM QUERY WALLET SERVICE");
      await invoke.removeKeyFromWallet(userId);
      return invokeWalletQuery;
    }
  } catch (exception) {
    console.log("IN CATCH WALLET QUERY SERVICE.");
    return exception;
  }
};

exports.UserQuery = async (userId, userKey) => {
  try {
    //await enrollAdmin.FabricAdminEnroll();
    const invokeWalletQuery = await queryUser.ChaincodeUserQuery(
      "busychannel",
      "busytoken",
      "GetUser",
      userId,
      userKey
    );

    if (invokeWalletQuery) {
      console.log("REMOVING KEY FROM QUERY WALLET SERVICE");
      await invoke.removeKeyFromWallet(userId);
      return invokeWalletQuery;
    }
  } catch (exception) {
    console.log("IN CATCH WALLET QUERY SERVICE.");
    return exception;
  }
};

exports.RecoverUsers = async (userData) => {
  try {
    await enrollAdmin.FabricAdminEnroll();
    const userRegistered = await recoverUser.FabricUserRecover(userData);
    if (userRegistered) {
      // remove the user certificate
      await invoke.removeKeyFromWallet(userData.userId);
      return {
        userRegistered: userRegistered,
      };
    }
  } catch (exception) {
    return exception;
  }
};
