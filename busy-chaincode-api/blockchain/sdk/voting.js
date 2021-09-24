const { Gateway, Wallets, FileSystemWallet } = require("fabric-network");
const fs = require("fs");
const path = require("path");

exports.FarbicInvokePool = async (
  channelName,
  contractName,
  functionName,
  walletId,
  userId,
  userKey,
  poolName,
  poolDescription,
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
   

    await wallet.put(userId, userKey);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(userId);
    if (!identity) {
      console.log("An identity for the user does not exist in the wallet");
      console.log("Run the registerUser.js application before retrying");
      return;
      // return {
      //   msg: "User registration failed.",
      // };
    }
    // Create a new gateway for connecting to our peer node.
     // const wallet = await new FileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: false },
    });
    // await gateway.connect(ccp, { wallet, identity: userdata.akcessId, discovery: { enabled: false, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    // const network = await gateway.getNetwork('akcesschannel');
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    // const contract = network.getContract('akcess');
    const contract = network.getContract(contractName);

    // Submit the specified transaction.
    // const invoked = await contract.submitTransaction('UpdateMobileNo', userdata.akcessId, userdata.phoneNumber);
    const result = await contract.submitTransaction(functionName,walletId,poolName,poolDescription, "BUSY");
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

exports.FarbicInvokeVote = async (
  channelName,
  contractName,
  functionName,
  walletId,
  userId,
  userKey,
  votingAddress,
  amount,
  voteType,
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
   

    await wallet.put(userId, userKey);

    // Check to see if we've already enrolled the user.
    // const identity = await wallet.exists(arguements.akcessId);
    const identity = await wallet.get(userId);
    if (!identity) {
      console.log("An identity for the user does not exist in the wallet");
      console.log("Run the registerUser.js application before retrying");
      return;
      // return {
      //   msg: "User registration failed.",
      // };
    }
    // Create a new gateway for connecting to our peer node.
     // const wallet = await new FileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: false },
    });
    // await gateway.connect(ccp, { wallet, identity: userdata.akcessId, discovery: { enabled: false, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    // const network = await gateway.getNetwork('akcesschannel');
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    // const contract = network.getContract('akcess');
    const contract = network.getContract(contractName);

    // Submit the specified transaction.
    const result = await contract.submitTransaction(functionName, walletId ,votingAddress, amount, voteType, "BUSY");
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


exports.FarbicInvokewithcreds = async (
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
     
  
      await wallet.put(userId, userKey);
  
      // Check to see if we've already enrolled the user.
      // const identity = await wallet.exists(arguements.akcessId);
      const identity = await wallet.get(userId);
      if (!identity) {
        console.log("An identity for the user does not exist in the wallet");
        console.log("Run the registerUser.js application before retrying");
        return;
        // return {
        //   msg: "User registration failed.",
        // };
      }
      // Create a new gateway for connecting to our peer node.
       // const wallet = await new FileSystemWallet(walletPath);
      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: false },
      });
      // await gateway.connect(ccp, { wallet, identity: userdata.akcessId, discovery: { enabled: false, asLocalhost: true } });
  
      // Get the network (channel) our contract is deployed to.
      // const network = await gateway.getNetwork('akcesschannel');
      const network = await gateway.getNetwork(channelName);
  
      // Get the contract from the network.
      // const contract = network.getContract('akcess');
      const contract = network.getContract(contractName);
  
      // Submit the specified transaction.
      // const invoked = await contract.submitTransaction('UpdateMobileNo', userdata.akcessId, userdata.phoneNumber);
      const result = await contract.submitTransaction(functionName);
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
  


  exports.FabricInvokeConfig = async (
    channelName,
    contractName,
    functionName,
    userId,
    userKey,
    minimumCoins,
    poolFee,
    votingPeriod,
    votingStarttime,
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
     
  
      await wallet.put(userId, userKey);
  
      // Check to see if we've already enrolled the user.
      // const identity = await wallet.exists(arguements.akcessId);
      const identity = await wallet.get(userId);
      if (!identity) {
        console.log("An identity for the user does not exist in the wallet");
        console.log("Run the registerUser.js application before retrying");
        return;
        // return {
        //   msg: "User registration failed.",
        // };
      }
      // Create a new gateway for connecting to our peer node.
       // const wallet = await new FileSystemWallet(walletPath);
      const gateway = new Gateway();
      await gateway.connect(ccp, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: false },
      });
      // await gateway.connect(ccp, { wallet, identity: userdata.akcessId, discovery: { enabled: false, asLocalhost: true } });
  
      // Get the network (channel) our contract is deployed to.
      // const network = await gateway.getNetwork('akcesschannel');
      const network = await gateway.getNetwork(channelName);
  
      // Get the contract from the network.
      // const contract = network.getContract('akcess');
      const contract = network.getContract(contractName);
  
      // Submit the specified transaction.
      // const invoked = await contract.submitTransaction('UpdateMobileNo', userdata.akcessId, userdata.phoneNumber);
      const result = await contract.submitTransaction(functionName, minimumCoins ,poolFee, votingPeriod, votingStarttime, "BUSY");
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
  