const mongoose = require("mongoose");

const blacklist = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "token required"],
    },
  },
  { timestamps: true }
)

const Blacklist = mongoose.model("blacklist",blacklist);

module.exports = Blacklist;