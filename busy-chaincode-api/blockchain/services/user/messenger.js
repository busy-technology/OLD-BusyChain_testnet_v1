const fs = require("fs");
const crypto = require("crypto");

// SDK imports

const registerUser = require("../../sdk/registerUser");
const enrollAdmin = require("../../sdk/enrollAdmin");
const message = require("../../sdk/message");
const query = require("../../sdk/query");
const recoverUser = require("../../sdk/recoverUser");
const { exception } = require("console");

exports.SendMessage = async (sender, recipient, userKey) => {
  try {
    await enrollAdmin.FabricAdminEnroll();
    const invokeChaincode = await message.FarbiceInvokeMessage(
        "busychannel",
        "busytoken",
        "BusyMessenger:SendMessage",
        sender,
        recipient,
        userKey
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