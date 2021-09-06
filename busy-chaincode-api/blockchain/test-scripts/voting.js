const voting = require("../services/user/voting");
//const sendResponse = require('../middleware/requestHandler');

exports.CreatePool = async (userId, userKey, votingInfo) => {
  try {

    console.log("Recieved a create pool for ", votingInfo);

    const data = await voting.CreatePool(userId, userKey, votingInfo);


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


exports.CreateVote = async (userId, userKey, votingAddress, amount, voteType) => {
    try {
  
      console.log("Recieved a vote to ", votingAddress);
  
      const data = await voting.CreateVote(userId, userKey, votingAddress, amount, voteType);
  
  
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