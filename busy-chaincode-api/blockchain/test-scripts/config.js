const users = require("../services/user/users");
const blocks = require("../services/user/blocks");

exports.CurrentPhase = async (userId, userKey) => {
    try {
  
  
      const data = await users.CurrentPhase(userId, userKey);
  
      if (data) {
        console.log("RESPONSE FROM CHAINCODE", data);
        const output = {
          chaincodeResponse: data,
        };
        return output;
      } else {
        console.log("error");
      }
    } catch (exception) {
      //logger.error(exception.errors);
      //return sendResponse(res, false, 200, exception.errors);
      console.log("exception", exception);
    }
  };

  exports.CurrentFees = async (userId, userKey) => {
    try {
  
  
      const data = await users.CurrentFees(userId, userKey);
  
      if (data) {
        console.log("RESPONSE FROM CHAINCODE", data);
        const output = {
          chaincodeResponse: data,
        };
        return output;
      } else {
        console.log("error");
      }
    } catch (exception) {
      //logger.error(exception.errors);
      //return sendResponse(res, false, 200, exception.errors);
      console.log("exception", exception);
    }
  };


  exports.UpdateBlocks = async (userId, userKey) => {
    try {
      const data = await blocks.UpdateBlocks(userId, userKey);
      if (data) {
        console.log("RESPONSE FROM CHAINCODE", data);
        const output = {
          chaincodeResponse: data,
        };
        return output;
      } else {
        console.log("error");
      }
    } catch (exception) {
      //logger.error(exception.errors);
      //return sendResponse(res, false, 200, exception.errors);
      console.log("exception", exception);
    }
  };

  
  exports.GetBlockFromTransactionId = async (userId, userKey,txId) => {
    try {
      const data = await blocks.GetBlockFromTransactionId(userId, userKey,txId);
      if (data) {
        const output = {
          chaincodeResponse: data,
        };
        return output;
      } else {
        console.log("error while fetching transaction");
      }
    } catch (exception) {
      //logger.error(exception.errors);
      //return sendResponse(res, false, 200, exception.errors);
      console.log("exception", exception);
    }
  };

  