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
  numerator: {
    type: String,
    required: true,
  },
  denominator: {
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
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "vestingV1Transactions",
  vestingTransactionSchema
);
