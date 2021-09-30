const User = require("../../models/Users");
const bcrypt = require("bcrypt");
const saltRounds = 10;

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const password = req.body.password;
    const confirmPassword = req.body.password;
    const mnemonic = req.body.seedPhrase;
    console.log("Reset Password for USERID", userId);
    const user = await User.findOne({
      userId: userId
    });
    if (user) {
      if (password != confirmPassword) {
        console.log("Passwords do not match.");
        return res.send(404, {
          status: false,
          message: "Passwords do not match.",
        });
      }
      try {
        const salt = await bcrypt.genSaltSync(saltRounds);
        const hash = await bcrypt.hashSync(password, salt);
        const doc = await User.findOneAndUpdate({
          userId: userId
        }, {
          password: hash,
        }, {
          upsert: true,
          useFindAndModify: false
        });
        return res.send(200, {
          status: false,
          message: `Password Updated successfully.`,
        });
      } catch (exception) {
        console.log("exception in User exists", exception);
        return res.send(404, {
          status: false,
          message: `Seed phase is not correct.`,
        });
      }
  } else {
    console.log("UserId do not exists.");
    return res.send(404, {
      status: false,
      message: `UserId do not exists.`,
    });
  }
} catch (exception) {
  console.log(exception);
  return res.send(404, {
    status: false,
    message: `Something went wrong.`,
  });
}
};