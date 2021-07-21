module.exports = {
  utility: {
    required: require("./utility/required"),
    number: require("./utility/is-number"),
    userId: require("./utility/is-userId"),
    isEmail: require("./utility/is-number"),
  },
  auth: {
    generateToken: require("./auth/generate-token"),
  },
};
