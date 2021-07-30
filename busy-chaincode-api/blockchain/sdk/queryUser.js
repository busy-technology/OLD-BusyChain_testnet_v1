const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

exports.ChaincodeUserQuery = async (
  channelName,
  contractName,
  functionName,
  userId,
  userKey
) => {
  try {
    // load the network configuration
    const ccpPath = path.resolve(
      __dirname,
      "connection-profile",
      "connection-busy.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(
      process.cwd(),
      "blockchain",
      "network",
      "wallet"
    );
    // const walletPath = path.resolve(__dirname, '..', '..', 'network', 'wallet')
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    console.log(`Wallet path: ${walletPath}`);

    await wallet.put(userId, userKey);

    const identity = await wallet.get(userId);
    if (!identity) {
      console.log(
        'An identity for the user "user1" does not exist in the wallet'
      );
      console.log("Run the registerUser.js application before retrying");
      return;
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: false },
    });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(contractName);

    // Evaluate the specified transaction.
    // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
    // queryAllCars transaction - requires no arguements, ex: ('queryAllCars')
    const result = await contract.evaluateTransaction(functionName, userId);
    console.log(`Transaction has been evaluated.`);
    return result.toString();
  } catch (exception) {
    console.log(exception);
    return exception;
  }
};
