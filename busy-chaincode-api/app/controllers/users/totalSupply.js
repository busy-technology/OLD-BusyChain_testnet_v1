const Admin = require("../../models/admin");
const IssuetokenTransactions = require("../../models/issued-tokens");
const totalSupply = require("../../../blockchain/test-scripts/totalSupply");

module.exports = async (req, res, next) => {
  try {
    const symbol = req.body.symbol;
    const adminId = "busy_network";
    const userId = "sample";

    console.log("IN USER");
    const adminData = await Admin.findOne({ userId: adminId });
    console.log("ADMIN", adminData);

    const credentials = {
      certificate: adminData.certificate.credentials.certificate,
      privateKey: adminData.certificate.credentials.privateKey,
    };

    const blockchain_credentials = {
      credentials: credentials,
      mspId: adminData.certificate.mspId,
      type: adminData.certificate.type,
    };

    // const lowerToken = symbol.toLowerCase();
    // console.log("LOWER TOKEN", lowerToken);

    const coinSymbol = await IssuetokenTransactions.findOne({
      tokenSymbol: symbol,
    });
    console.log("COIN", coinSymbol);

    if (coinSymbol || symbol == "BUSY") {
      const response1 = await totalSupply.totalSupply(
        userId,
        blockchain_credentials,
        symbol
      );
      console.log("RESPONSE 1", response1);
      const response = JSON.parse(response1.chaincodeResponse);
      console.log("DATA 2", response);
      //console.log("DATA 2", response.chaincodeResponse);
      const balance = response.data;
      console.log("BALANCE", response.data);

      if (response.success == true) {
        return res.send(200, {
          status: true,
          message: "Total supply has been successfully fetched",
          chaincodeResponse: response,
        });
      } else {
        console.log("Failed to execute chaincode function");
        return res.send(404, {
          status: false,
          message: `Failed to execute chaincode function`,
          chaincodeResponse: response,
        });
      }
    } else {
      console.log("Token symbol does not exist");
      return res.send(404, {
        status: false,
        message: `Token symbol does not exist`,
      });
    }
  } catch (exception) {
    console.log(exception);
    return res.send(404, {
      status: false,
      message: `Something went wrong`,
      Error: exception.message,
    });
  }
};
