const enrollAdmin = require("../../sdk/enrollAdmin");
const voting = require("../../sdk/voting");
exports.CreatePool = async (walletId, userId, userKey, poolName, poolDescription) => {
  try {
    await enrollAdmin.FabricAdminEnroll();
    const invokeChaincode = await voting.FarbicInvokePool(
        "busychannel",
        "busytoken",
        "BusyVoting:CreatePool",
         walletId,
         userId,
         userKey,
         poolName,
         poolDescription
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
      const invokeChaincode = await voting.FarbicInvokeVote(
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
      const invokeChaincode = await voting.FarbicInvokewithcreds(
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
      const invokeChaincode = await voting.FarbicQuerywithcreds(
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
      const invokeChaincode = await voting.FarbicQuerywithcreds(
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

  exports.PoolConfig = async (userId, userKey) => {
    try {
      await enrollAdmin.FabricAdminEnroll();
      const invokeChaincode = await voting.FarbicQuerywithcreds(
          "busychannel",
          "busytoken",
          "BusyVoting:PoolConfig",
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

  exports.UpdatePoolConfig = async (userId, userKey, minimumCoins, poolFee, votingPeriod, votingStartTime) => {
    try {
      await enrollAdmin.FabricAdminEnroll();
      const invokeChaincode = await voting.FabricInvokeConfig(
          "busychannel",
          "busytoken",
          "BusyVoting:UpdatePoolConfig",
          userId,
          userKey,
          minimumCoins,
          poolFee,
          votingPeriod,
          votingStartTime
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