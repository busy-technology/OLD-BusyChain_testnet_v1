module.exports = {
  utility: {
    required: require("./utility/required"),
    number: require("./utility/is-number"),
    userId: require("./utility/is-userId"),
    isEmail: require("./utility/is-email"),
    isPassword: require("./utility/is-password"),
    isCountry: require("./utility/is-country"),
    isName: require("./utility/is-name"),
    isAmount: require("./utility/is-amount"),
  },
  auth: {
    generateToken: require("./auth/generate-token"),
  },
};
