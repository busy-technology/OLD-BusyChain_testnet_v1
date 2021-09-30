const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vestingTransactionSchema = new Schema({
  recipient: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  startAt: {
    type: String,
    required: true,
  },
  releaseAt: {
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
});

module.exports = mongoose.model(
  "vestingV2Transactions",
  vestingTransactionSchema
);
