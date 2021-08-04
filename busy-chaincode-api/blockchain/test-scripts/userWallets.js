const UserServices = require("../services/user/users");
//const { queryWallet } = require("./queryWallet");
//const sendResponse = require('../middleware/requestHandler');

exports.userWallet = async (userId, userKey) => {
  try {
    //const walletID = wallet;
    console.log("UserKey", userKey);
    console.log("UserId", userId);
    const data = await UserServices.UserQuery(userId, userKey);

    console.log("DATA", data);

    if (data) {
      const output = {
        chaincodeResponse: data,
      };
      return output;
    } else {
      //   return sendResponse(res, false, 200, txId, 'User already exists');
      console.log("error");
    }
  } catch (exception) {
    //logger.error(exception.errors);
    //return sendResponse(res, false, 200, exception.errors);
    console.log("exception", exception);
  }
};

// userWallet("admin", {
//   credentials: {
//     certificate:
//       "-----BEGIN CERTIFICATE-----\nMIIB6TCCAY+gAwIBAgIUP4Bn21iIjbfioLJZsS0HZuXqfw4wCgYIKoZIzj0EAwIw\nZjELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\nEwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRcwFQYDVQQDEw5CdXN5VGVj\naG5vbG9neTAeFw0yMTA4MDIxMTUzMDBaFw0yMjA4MDIxMTU4MDBaMCExDzANBgNV\nBAsTBmNsaWVudDEOMAwGA1UEAxMFYWRtaW4wWTATBgcqhkjOPQIBBggqhkjOPQMB\nBwNCAAQNhx4ongnkjNWQmfNRe0wZcLLCtwZ6N2X0122M6Xo0UZsCIosS4RF2skQU\nuVmTZNANl+NWN2D3hGTFj6BFJkAWo2AwXjAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0T\nAQH/BAIwADAdBgNVHQ4EFgQUXIsCRYanEcWNXG5Y+jv9c0oRk/wwHwYDVR0jBBgw\nFoAUqgwrF4DUpARpD+MxPTUvcwtKylIwCgYIKoZIzj0EAwIDSAAwRQIhAO6m6tz3\nT3iqnGsg60JzF2mhSwLFO2agYzmmGSl3wRj4AiB6Y8CxDF0zG5pr0MrolbjGE9jg\nFNpMFJW1BPjl8TgmGQ==\n-----END CERTIFICATE-----\n",
//     privateKey:
//       "-----BEGIN PRIVATE KEY-----\r\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgsW6rNkI5rUDz/Q8m\r\nKYxKfQ1rYS7h97E6BJhSIlQQIbOhRANCAAQNhx4ongnkjNWQmfNRe0wZcLLCtwZ6\r\nN2X0122M6Xo0UZsCIosS4RF2skQUuVmTZNANl+NWN2D3hGTFj6BFJkAW\r\n-----END PRIVATE KEY-----\r\n",
//   },
//   mspId: "BusyMSP",
//   type: "X.509",
// });
