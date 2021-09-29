const User = require("../../models/Users");
const RecoverScript = require("../../../blockchain/test-scripts/recoverUser");
const bs58 = require("bs58");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const mnemonic = req.body.mnemonic;

    console.log("USERID", userId);
    console.log("SEED", mnemonic);
    const user = await User.findOne({ userId: userId });

    if (user) {
      try {
        const response = await RecoverScript.recoverUsers(userId, mnemonic);

        console.log("CRED", response.blockchain_credentials.credentials);

        if (response.blockchain_credentials.credentials) {
          console.log(
            "PRIVATE KEY",
            response.blockchain_credentials.credentials.privateKey
          );

          const bytes = Buffer.from(
            response.blockchain_credentials.credentials.privateKey,
            "utf-8"
          );

          const encodedPrivateKey = bs58.encode(bytes);

          console.log("Encoded Key", encodedPrivateKey);

          response.blockchain_credentials.credentials.privateKey =
            encodedPrivateKey;

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
