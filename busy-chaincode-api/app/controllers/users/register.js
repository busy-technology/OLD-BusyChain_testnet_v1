const User = require("../../models/Users");
const UserScript = require("../../../blockchain/test-scripts/userRegister");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const bs58 = require("bs58");

module.exports = async (req, res, next) => {
  try {
    const userId = req.body.userId,
      firstName = req.body.firstName || "",
      lastName = req.body.lastName || "",
      email = req.body.email || "",
      mobile = req.body.mobile || "",
      password = req.body.password,
      country = req.body.country || "",
      confirmPassword = req.body.confirmPassword;

    const user = await User.findOne({ userId: userId });
    console.log("User", user);
    if (user) {
      console.log("UserId already taken.");
      return res.send(404, {
        status: false,
        message: `UserId ${user.userId} already taken.`,
      });
    } else if (password != confirmPassword) {
      console.log("Passwords do not match.");
      return res.send(404, {
        status: false,
        message: "Passwords do not match.",
      });
    } else {
      const salt = await bcrypt.genSaltSync(saltRounds);
      const hash = await bcrypt.hashSync(password, salt);
      const data = await UserScript.registerUsers(userId);
      console.log("DATA 2", data);
      console.log("HASH", hash);
      console.log(
        "PRIVATE KEY",
        data.blockchain_credentials.credentials.privateKey
      );

      const bytes = Buffer.from(
        data.blockchain_credentials.credentials.privateKey,
        "utf-8"
      );

      const encodedPrivateKey = bs58.encode(bytes);

      if (data.chaincodeResponse.success == true) {
        const users = await new User({
          firstName: firstName,
          lastName: lastName,
          email: email,
          mobile: mobile,
          userId: userId,
          walletId: data.chaincodeResponse.data,
          password: hash,
          country: country,
          txId: data.chaincodeResponse.txId,
          walletBalance: 0,
          messageCoins: {
            totalCoins: 0,
          },
        });

        await users
          .save()
          .then((result, error) => {
            console.log("User registered.");
          })
          .catch((error) => {
            console.log("ERROR DB", error);
          });

        data.blockchain_credentials.credentials.privateKey = encodedPrivateKey;

        return res.send(200, {
          status: true,
          message: "User registered.",
          seedPhase: data.seed,
          privateKey: data.blockchain_credentials,
          chaincodeResponse: data.chaincodeResponse,
        });
      } else {
        console.log("Failed to execute chaincode function");
        return res.send(404, {
          status: false,
          message: `Failed to execute chaincode function.`,
        });
      }
    }
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
    });
  }
};
