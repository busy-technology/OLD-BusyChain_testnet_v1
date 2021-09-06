const enrollAdmin = require("../../sdk/enrollAdmin");
const voting = require("../../sdk/voting");
exports.CreatePool = async (userId, userKey, votingInfo) => {
  try {
    await enrollAdmin.FabricAdminEnroll();
    const invokeChaincode = await voting.FarbiceInvokePool(
        "busychannel",
        "busytoken",
        "BusyVoting:CreatePool",
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

exports.CreateVote = async (userId, userKey, votingAddress, amount, voteType) => {
    try {
      await enrollAdmin.FabricAdminEnroll();
      const invokeChaincode = await voting.FarbiceInvokeVote(
          "busychannel",
          "busytoken",
          "BusyVoting:CreateVote",
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
      const invokeChaincode = await voting.FarbiceInvokeDestroy(
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
      const invokeChaincode = await voting.FarbiceInvokeDestroy(
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