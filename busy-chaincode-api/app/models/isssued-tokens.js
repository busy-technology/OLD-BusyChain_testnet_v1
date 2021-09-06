const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const issuedCoinsSchema = new Schema({
  tokenName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    lowercase: true,
  },
  amount: {
    type: String,
    required: true,
  },
  tokenSymbol: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
    lowercase: true,
  },
  tokenAdmin: {
    type: String,
    required: true,
  },
  tokenSupply: {
    type: String,
    required: true,
  },
  tokendeciamls: {
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

module.exports = mongoose.model("issuedCoins", issuedCoinsSchema);
