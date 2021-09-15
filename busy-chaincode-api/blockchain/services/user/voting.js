const enrollAdmin = require("../../sdk/enrollAdmin");
const voting = require("../../sdk/voting");
exports.CreatePool = async (walletId, userId, userKey, votingInfo) => {
  try {
    await enrollAdmin.FabricAdminEnroll();
    const invokeChaincode = await voting.FarbiceInvokePool(
        "busychannel",
        "busytoken",
        "BusyVoting:CreatePool",
         walletId,
         userId,
         userKey,
         votingInfo
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

exports.CreateVote = async (walletId, userId, userKey, votingAddress, amount, voteType) => {
    try {
      await enrollAdmin.FabricAdminEnroll();
      const invokeChaincode = await voting.FarbiceInvokeVote(
          "busychannel",
          "busytoken",
          "BusyVoting:CreateVote",
          walletId, 
          userId,
          userKey, 
          votingAddress, 
          amount, 
          voteType
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

  exports.DestroyPool = async (userId, userKey) => {
    try {
      await enrollAdmin.FabricAdminEnroll();
      const invokeChaincode = await voting.FarbiceInvokewithcreds(
          "busychannel",
          "busytoken",
          "BusyVoting:DestroyPool",
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


  exports.QueryPool = async (userId, userKey) => {
    try {
      await enrollAdmin.FabricAdminEnroll();
      const invokeChaincode = await voting.FarbiceInvokewithcreds(
          "busychannel",
          "busytoken",
          "BusyVoting:QueryPool",
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


  exports.PoolHistory = async (userId, userKey) => {
    try {
      await enrollAdmin.FabricAdminEnroll();
      const invokeChaincode = await voting.FarbiceInvokewithcreds(
          "busychannel",
          "busytoken",
          "BusyVoting:PoolHistory",
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