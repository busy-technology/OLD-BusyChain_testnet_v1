const User = require("../../models/Users");
const RecoverScript = require("../../../blockchain/test-scripts/recoverUser");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const mnemonic = req.body.mnemonic;

    console.log("USERID", userId);
    console.log("SEED", mnemonic);
    const user = await User.findOne({ userId: userId });

    if (user) {
      try {
        console.log("IN USER");
        const response = await RecoverScript.recoverUsers(userId, mnemonic);
        console.log("RESPONSE", response);

        if (response.blockchain_credentials.credentials) {
          return res.send(200, {
            status: true,
            message: "User enrollment with CA successfull.",
            privateKey: response.blockchain_credentials,
          });
        }
      } catch (exception) {
        console.log("exception in User exists", exception);
        return res.send(404, {
          status: false,
          message: `Something went wrong`,
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
      message: `Something went wrong`,
    });
  }
};
