const voting = require("../services/user/voting");
//const sendResponse = require('../middleware/requestHandler');

exports.CreatePool = async (walletId, userId, userKey, poolName, poolDescription) => {
  try {

    console.log("Recieved a create pool for ", poolName);

    const data = await voting.CreatePool(walletId, userId, userKey, poolName, poolDescription);


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


exports.CreateVote = async (walletId, userId, userKey, votingAddress, amount, voteType) => {
    try {
  
      console.log("Recieved a vote to ", votingAddress);
  
      const data = await voting.CreateVote(walletId, userId, userKey, votingAddress, amount, voteType);
  
  
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

  exports.DestroyPool = async (userId, userKey) => {
    try {
  
  
      const data = await voting.DestroyPool(userId, userKey);
  
  
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

  exports.QueryPool = async (userId, userKey) => {
    try {
  
  
      const data = await voting.QueryPool(userId, userKey);
  
  
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

  exports.PoolHistory = async (userId, userKey) => {
    try {
  
  
      const data = await voting.PoolHistory(userId, userKey);
  
  
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

  exports.PoolConfig = async (userId, userKey) => {
    try {
  
  
      const data = await voting.PoolConfig(userId, userKey);
  
  
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


exports.UpdatePoolConfig = async (userId, userKey, minimumCoins, poolFee, votingPeriod, votingStartTime) => {
  try {

    const data = await voting.UpdatePoolConfig(userId, userKey, minimumCoins, poolFee, votingPeriod, votingStartTime);

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
