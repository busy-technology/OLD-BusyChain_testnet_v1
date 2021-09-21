const mongoose = require("mongoose");
const timeStamp = require("mongoose-timestamp");

const WalletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  walletId: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  txId: {
    type: String,
    required: true,
  },
});

WalletSchema.plugin(timeStamp);

const Wallets = mongoose.model("StakingAddress", WalletSchema);
module.exports = Wallets;
