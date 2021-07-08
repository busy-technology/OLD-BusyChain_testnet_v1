const FabricCAServices = require("fabric-ca-client");
const { Wallets } = require("fabric-network");
// const { Wallets } = require('fabric-network');
// const FabricCAServices = require('fabric-ca-client');
const fs = require("fs");
const path = require("path");

// bip129 algorith
const bip39 = require("bip39");
//console.log("mnemonic",mnemonic);
// => 'seed sock milk update focus rotate barely fade car face mechanic mercy'
// => '5cf2d4a8b0355e90295bdfc565a022a409af063d5365bb57bf74d9528f494bfa4400f53d8349b80fdae44082d7f9541e1dba2b003bcfec9d0d53781ca676651f'
//import logger from '../middleware/logger';

// exports.FabricUser = (req, res, next) => {
// }
exports.FabricUserRegister = async (userData, key) => {
  try {
    console.log("IN REGISTER USER SDK");
    // load the network configuration
    const ccpPath = path.resolve(
      __dirname,
      "connection-profile",
      "connection-busy.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Modified changes according to Live Network

    // Create a new CA client for interacting with the CA.
    // const caURL = ccp.certificateAuthorities['ca.akcess.io'].url;
    // const ca = new FabricCAServices(caURL);

    // Create a new CA client for interacting with the CA.
    const caInfo = ccp.certificateAuthorities["ca.busy.technology"];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    // Create a new file system based wallet for managing identities.
    //const walletPath = path.join(process.cwd(), "..", "network", "wallet");
    const walletPath = path.join(
      process.cwd(),
      "blockchain",
      "network",
      "wallet"
    );
    // const walletPath = path.resolve(__dirname, '..', '..', 'network', 'wallet')
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    // const wallet = await new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const userExists = await wallet.get(userData.userId);
    if (userExists) {
      console.log("An identity for the user already exists in the wallet");
      return `An identity for the user ${userData.userId} already exists in hyperledger.`;
    }

    // Check to see if we've already enrolled the admin user.
    const adminExists = await wallet.get("admin");
    if (!adminExists) {
      console.log(
        'An identity for the admin user "admin" does not exist in the wallet'
      );
      console.log("Run the enrollAdmin.js application before retrying");
      return `Run the enrollAdmin.js application before retrying`;
    }
    // const gateway = new Gateway()
    // await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: false, asLocalhost: false } })

    // Get the CA client object from the gateway for interacting with the CA.
    // const ca = gateway.getClient().getCertificateAuthority()
    // const adminIdentity = gateway.getCurrentIdentity()

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminExists.type);
    const adminUser = await provider.getUserContext(adminExists, "admin");

    const secret = bip39.mnemonicToSeedSync(key).toString("hex");
    console.log("SEC", secret);

    // Register the user, enroll the user, and import the new identity into the wallet.
    // const secret = await ca.register({
    //     affiliation: 'org1.department1',
    //     enrollmentID: userData.akcessId,
    //     role: 'client'
    // }, adminIdentity);
    // const enrollment = await ca.enroll({
    //     enrollmentID: userData.akcessId,
    //     enrollmentSecret: secret
    // });

    // const userIdentity = X509WalletMixin.createIdentity('akcessMSP', enrollment.certificate, enrollment.key.toBytes())
    // const userWalletAdded = await wallet.import(userData.akcessId, userIdentity);
    // console.log('Successfully registered and enrolled admin user "user11" and imported it into the wallet');
    // return userIdentity
    const secret1 = await ca.register(
      {
        enrollmentID: userData.userId,
        enrollmentSecret: secret,
        role: "client",
      },
      adminUser
    );

    console.log("secret1", secret1);
    console.log("secret1", secret1 === secret);

    const enrollment = await ca.enroll({
      enrollmentID: userData.userId,
      enrollmentSecret: secret,
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "BusyMSP",
      type: "X.509",
    };

    await wallet.put(userData.userId, x509Identity);

    console.log(
      `Successfully registered and enrolled user ${userData.userId}.`
    );
    return x509Identity;
  } catch (exception) {
    // logger.error(exception.errors);
    // console.log("EXCEPTIONS", expection.errors);
    return exception;
  }
};
