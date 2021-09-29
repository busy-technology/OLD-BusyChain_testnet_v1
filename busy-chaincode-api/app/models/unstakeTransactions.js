const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UnstakeTransactionSchema = new Schema({
  tokenName: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  txId: {
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
  totalReward: {
    type: String,
    required: true,
  },
  claimed: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("unstakeTransactions", UnstakeTransactionSchema);