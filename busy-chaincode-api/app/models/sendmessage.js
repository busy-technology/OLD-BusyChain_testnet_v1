const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SendMessageTransactionSchema = new Schema({
  tokenName: {
    type: String,
    required: true,
  },
  function: {
    type: String,
    required: true,
  },
  txId: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  blockNum: {
    type: Number,
    required: true,
  },
  dataHash: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("sendMessageTransactions", SendMessageTransactionSchema);