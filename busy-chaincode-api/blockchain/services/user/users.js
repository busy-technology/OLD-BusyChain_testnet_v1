const fs = require("fs");
const crypto = require("crypto");

// SDK imports

const registerUser = require("../../sdk/registerUser");
const enrollAdmin = require("../../sdk/enrollAdmin");
const enrollOrdererAdmin = require("../../sdk/enrollOrdererAdmin");
const invoke = require("../../sdk/invoke");
const query = require("../../sdk/query");
const queryUser = require("../../sdk/queryUser");
const querySupply = require("../../sdk/querySupply");
const recoverUser = require("../../sdk/recoverUser");
const { exception } = require("console");
const voting = require("../../sdk/voting");

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

exports.attemptUnlock = async (userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "AttemptUnlock",
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
    console.log("IN CATCH OF ISSUE TOKEN SERVICE.");
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
    // const invokeFabricChaincodeWithCertificate =
    //   await invoke.FabricChaincodeInvokeWithCertificate(
    //     "busychannel",
    //     "busytoken",
    //     "GetTotalSupply",
    //     walletDetails,
    //     userId,
    //     userKey
    //   );

    const invokeWalletQuery = await querySupply.ChaincodeSupplyQuery(
      "busychannel",
      "busytoken",
      "GetTotalSupply",
      walletDetails,
      userId,
      userKey
    );

    if (invokeWalletQuery) {
      // function to remove the user key

      await invoke.removeKeyFromWallet(userId);
      return invokeWalletQuery;
    }
  } catch (exception) {
    console.log("IN CATCH OF ISSUE TOKEN SERVICE.");
    //return { error: exception };
    return exception;
  }
};

exports.stakingInfo = async (walletDetails, userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await querySupply.ChaincodeStakingQuery(
        "busychannel",
        "busytoken",
        "GetStakingInfo",
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

exports.transactionFees = async (walletDetails, userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "UpdateTransferFee",
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

exports.burnTokens = async (walletDetails, userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "Burn",
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

exports.vesting1 = async (walletDetails, userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "MultibeneficiaryVestingV1",
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

exports.vesting2 = async (walletDetails, userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "MultibeneficiaryVestingV2",
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

exports.getLockedTokens = async (walletDetails, userId, userKey) => {
  try {
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "GetLockedTokens",
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

exports.claimToken = async (walletDetails, userId, userKey) => {
  try {
    await enrollOrdererAdmin.FabricAdminEnroll();
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "Claim",
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

exports.unstakeToken = async (walletDetails, userId, userKey) => {
  try {
    await enrollOrdererAdmin.FabricAdminEnroll();
    const invokeFabricChaincodeWithCertificate =
      await invoke.FabricChaincodeInvokeWithCertificate(
        "busychannel",
        "busytoken",
        "Unstake",
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
    throw(exception);
  }
};


exports.CurrentPhase = async (userId, userKey) => {
  try {
    await enrollAdmin.FabricAdminEnroll();
    const invokeChaincode = await voting.FarbicQuerywithcreds(
        "busychannel",
        "busytoken",
        "GetCurrentPhase",
        userId,
        userKey,
      );
    if (invokeChaincode) {
        return invokeChaincode;
    } 
    else {
        return null
    }
  } catch (exception) {
    return exception;
  }
};


exports.CurrentFees = async (userId, userKey) => {
  try {
    await enrollAdmin.FabricAdminEnroll();
    const invokeChaincode = await voting.FarbicQuerywithcreds(
        "busychannel",
        "busytoken",
        "GetCurrentFee",
        userId,
        userKey,
      );
    if (invokeChaincode) {
        return invokeChaincode;
    } 
    else {
        return null
    }
  } catch (exception) {
    return exception;
  }
};
