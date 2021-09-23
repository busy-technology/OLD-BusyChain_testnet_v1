const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BlocksSchema = new Schema({
  blockNum: {
      type: Number,
      required: true,
  },
  txCount: {
      type: Number,
      required: true,
  },
  dataHash: {
      type: String,
      required: true,
  },
  blockHash: {
      type: String,
      required: true,
  },
  preHash: String,
  transactions: {
      type: Array,
      required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("blocks", BlocksSchema);
