const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenTransactionSchema = new Schema({
  tokenName: {
    type: String,
    required: true,
  },
  amount: {
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
  receiver: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("tokenTransactions", tokenTransactionSchema);
