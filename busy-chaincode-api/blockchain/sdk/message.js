const { Gateway, Wallets, FileSystemWallet } = require("fabric-network");
const fs = require("fs");
const path = require("path");

exports.FarbiceInvokeMessage = async (
  channelName,
  contractName,
  functionName,
  sender,
  recipient,
  userKey,
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
   

    await wallet.put(sender, userKey);

    // Check to see if we've already enrolled the user.
    // const identity = await wallet.exists(arguements.akcessId);
    // const identity = await wallet.get(userId);
    // if (!identity) {
    //   console.log("An identity for the user does not exist in the wallet");
    //   console.log("Run the registerUser.js application before retrying");
    //   return;
    //   // return {
    //   //   msg: "User registration failed.",
    //   // };
    // }
    // Create a new gateway for connecting to our peer node.
     // const wallet = await new FileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: sender,
      discovery: { enabled: true, asLocalhost: false },
    });
    // await gateway.connect(ccp, { wallet, identity: userdata.akcessId, discovery: { enabled: false, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    // const network = await gateway.getNetwork('akcesschannel');
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    // const contract = network.getContract('akcess');
    const contract = network.getContract(contractName);

    console.log(contractName)
    // Submit the specified transaction.
    // const invoked = await contract.submitTransaction('UpdateMobileNo', userdata.akcessId, userdata.phoneNumber);
    const result = await contract.submitTransaction(functionName,recipient, "busy");
    console.log("Transaction has been submitted");
    console.log("result: ", result.toString());
    // Disconnect from the gateway.
    await gateway.disconnect();
    return result.toString();
  } catch (exception) {
    // logger.error(exception.errors);
    return exception;
  }
};


