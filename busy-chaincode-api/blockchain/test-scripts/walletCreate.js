const UserServices = require("../services/user/users");

//const sendResponse = require('../middleware/requestHandler');

exports.WalletCreation = async (userId, userKey) => {
  try {
    console.log("USER KEY", userKey);
    const data = await UserServices.CreateWallet(userId, userKey);

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
    }
  } catch (exception) {
    //logger.error(exception.errors);
    //return sendResponse(res, false, 200, exception.errors);
    console.log("exception", exception);
  }
};

// WalletCreation("robert79787", {
//   credentials: {
//     certificate:
//       "-----BEGIN CERTIFICATE-----\nMIICUDCCAfegAwIBAgIUVR7OVChTa5pqoaD2eT1fu5tKmaIwCgYIKoZIzj0EAwIw\nZjELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\nEwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRcwFQYDVQQDEw5CdXN5VGVj\naG5vbG9neTAeFw0yMTA3MDgxMTQ2MDBaFw0yMjA3MDgxMTUxMDBaMCcxDzANBgNV\nBAsTBmNsaWVudDEUMBIGA1UEAxMLcm9iZXJ0Nzk3ODcwWTATBgcqhkjOPQIBBggq\nhkjOPQMBBwNCAASGFm0+FaHQ6jOquPpvkEFIY43DcA94Qw8XHSxsGlaX2Z+VwcFV\nzg5yvQCghf8imib10+eI2kKblpko6H1ibTlmo4HBMIG+MA4GA1UdDwEB/wQEAwIH\ngDAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBRrGpnol6UB1a3RHUR4iX7wBJY4KzAf\nBgNVHSMEGDAWgBRVFdD1wi/0vzFZXfFNZID1a9RoajBeBggqAwQFBgcIAQRSeyJh\ndHRycyI6eyJoZi5BZmZpbGlhdGlvbiI6IiIsImhmLkVucm9sbG1lbnRJRCI6InJv\nYmVydDc5Nzg3IiwiaGYuVHlwZSI6ImNsaWVudCJ9fTAKBggqhkjOPQQDAgNHADBE\nAiBgWgLfIXOey1wuq7xVgclgl42jRK3Ck9wS/gy8/oS0CwIgXFFj3VmSRoT0mkw0\nkSuYFyLBEeIKmHvwZy+chH94MSU=\n-----END CERTIFICATE-----\n",
//     privateKey:
//       "-----BEGIN PRIVATE KEY-----\r\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgV7ajf/sMire0uJpq\r\nvvzqw/MMviskMKZrNYzuDN36kEShRANCAASGFm0+FaHQ6jOquPpvkEFIY43DcA94\r\nQw8XHSxsGlaX2Z+VwcFVzg5yvQCghf8imib10+eI2kKblpko6H1ibTlm\r\n-----END PRIVATE KEY-----\r\n",
//   },
//   mspId: "BusyMSP",
//   type: "X.509",
// });
