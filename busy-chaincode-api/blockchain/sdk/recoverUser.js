const FabricCAServices = require("fabric-ca-client");
const { Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");

// bip129 algorith
const bip39 = require("bip39");

exports.FabricUserRecover = async (userData) => {
  try {
    // load the network configuration
    const ccpPath = path.resolve(
      __dirname,
      "connection-profile",
      "connection-busy.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    const caInfo = ccp.certificateAuthorities["ca.busy.technology"];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName
    );

    // Create a new file system based wallet for managing identities.
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
      return;
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminExists.type);
    const adminUser = await provider.getUserContext(adminExists, "admin");

    const secret = bip39.mnemonicToSeedSync(userData.mnemonic).toString("hex");
    console.log("SEC", secret);

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

    console.log(`Successfully enrolled user ${userData.userId}.`);
    return x509Identity;
  } catch (exception) {
    // logger.error(exception.errors);
    throw exception;
  }
};
