const UserServices = require("../services/user/users");

//const sendResponse = require('../middleware/requestHandler');

exports.transferToken = async (userId, userKey, recipiant, amount, token) => {
  try {
    console.log("USER KEY", userKey);
    const walletDetails = {
      recipiant: recipiant,
      amount: amount,
      token: token,
    };
    const data = await UserServices.transferToken(
      walletDetails,
      userId,
      userKey
    );

    console.log("DATA", data);

    if (data) {
      //const response = JSON.parse(data.chaincodeResponse);
      //console.log("RESPONSE FROM CHAINCODE", response);
      const output = {
        chaincodeResponse: data,
      };
      console.log("OUTPUT", output);
      return output;
    } else {
      const output = {
        chaincodeResponse: exception.message,
      };
      return output;
      console.log("OUTPUT", exception.message);
    }
  } catch (exception) {
    //logger.error(exception.errors);
    //return sendResponse(res, false, 200, exception.errors);
    console.log("exception", exception);
  }
};

// transferToken(
//   "admin1",
//   {
//     credentials: {
//       certificate:
//         "-----BEGIN CERTIFICATE-----\nMIIB6DCCAY+gAwIBAgIUPFr2ZPIuQpl+RoRpJUqbKsUofJYwCgYIKoZIzj0EAwIw\nZjELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\nEwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRcwFQYDVQQDEw5CdXN5VGVj\naG5vbG9neTAeFw0yMTA4MDIxMjU5MDBaFw0yMjA4MDIxMzA0MDBaMCExDzANBgNV\nBAsTBmNsaWVudDEOMAwGA1UEAxMFYWRtaW4wWTATBgcqhkjOPQIBBggqhkjOPQMB\nBwNCAAQpl/14Ot+jiMovwQsL9lhmdjp+JTaSjSj5ZEHlNniEHaafwjjrG+MSwA+X\njItbJ5Bb5Kc9Jclx1hx2XTsGUwFWo2AwXjAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0T\nAQH/BAIwADAdBgNVHQ4EFgQUzyQ/JKL5rZBcukeo/g2s0fUOvkgwHwYDVR0jBBgw\nFoAUl/78XX5D6adfOkkrHAh/qNaRDEIwCgYIKoZIzj0EAwIDRwAwRAIgB0kiOZNr\nKKzjUF40F/1xK1iZ8HK7BL/5IM9bfdi/GP0CICepab2SpYPugJ09ZlIMdExTz04e\nrU5j6J3yUNI7Vmqf\n-----END CERTIFICATE-----\n",
//       privateKey:
//         "-----BEGIN PRIVATE KEY-----\r\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgO1CAIZZM86PU2A3a\r\nKgm0VvaSJIadukxpO1XyOEFplmKhRANCAAQpl/14Ot+jiMovwQsL9lhmdjp+JTaS\r\njSj5ZEHlNniEHaafwjjrG+MSwA+XjItbJ5Bb5Kc9Jclx1hx2XTsGUwFW\r\n-----END PRIVATE KEY-----\r\n",
//     },
//     mspId: "BusyMSP",
//     type: "X.509",
//   },
//   "be0f826b62bdcbd1a464ffc46746fd33b1d644f5d53ea1d1061554d7571febcf",
//   "5000",
//   "Busy"
// );
