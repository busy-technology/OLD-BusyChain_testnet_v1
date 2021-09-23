const enrollAdmin = require("../../sdk/enrollAdmin");
const blocks = require("../../sdk/blocks");


exports.UpdateBlocks = async (userId, userKey) => {
  try {
    const invokeChaincode = await blocks.FabricInvokeBlocks(
        "busychannel",
        "qscc",
        "GetChainInfo",
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


exports.GetBlockFromTransactionId = async (userId, userKey,txId) => {
  try {
    const invokeChaincode = await blocks.FabricInvokeBlocksTransaction(
        "busychannel",
        "qscc",
        "GetBlockByTxID",
         userId,
         userKey,
         txId,
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