package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric/common/flogging"
)

// BusyToken chaincode
type BusyToken struct {
	contractapi.Contract
}

var logger = flogging.MustGetLogger("busy")

// CreateUser creates new user on busy blockchain
func (bt *BusyToken) CreateUser(ctx contractapi.TransactionContextInterface) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	commonName, _ := getCommonName(ctx)
	userAsBytes, err := ctx.GetStub().GetState(commonName)
	if userAsBytes != nil {
		response.Message = fmt.Sprintf("User with common name %s already exists", commonName)
		logger.Info(response.Message)
		return response
	}
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user from blockchain: %s" + err.Error())
		logger.Error(response.Message)
		return response
	}

	userID, _ := ctx.GetClientIdentity().GetID()
	user := User{
		DocType: "user",
		UserID:  userID,
	}
	userAsBytes, _ = json.Marshal(user)
	err = ctx.GetStub().PutState(commonName, userAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s" + err.Error())
		logger.Error(response.Message)
		return response
	}

	wallet := Wallet{
		DocType: "wallet",
		UserID:  userID,
		Address: response.TxID,
		Balance: 0.00,
	}
	walletAsBytes, _ := json.Marshal(wallet)
	err = ctx.GetStub().PutState(response.TxID, walletAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s" + err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = fmt.Sprintf("User %s created", commonName)
	response.Success = true
	response.Data = response.TxID
	logger.Info(response.Message)
	return response
}

// CreateStakingAddress create new staking address for user
func (bt *BusyToken) CreateStakingAddress(ctx contractapi.TransactionContextInterface) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	// utxo := UTXO{
	// 	Address: response.TxID,
	// 	Amount:  0.0,
	// 	Token:   "Busy",
	// }
	// utxoAsBytes, _ := json.Marshal(utxo)
	// err := ctx.GetStub().PutState(response.TxID, utxoAsBytes)
	// if err != nil {
	// 	response.Message = fmt.Sprintf("Error while creating new wallet address: %s" + err.Error())
	// 	logger.Error(response.Message)
	// 	return response
	// }

	commonName, _ := getCommonName(ctx)
	stakingAddress := Wallet{
		DocType: "stakingAddr",
		UserID:  commonName,
		Address: response.TxID,
		Balance: 0.00,
	}
	stakingAddrAsBytes, _ := json.Marshal(stakingAddress)
	err := ctx.GetStub().PutState(response.TxID, stakingAddrAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s" + err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = fmt.Sprintf("Staking address %s created", response.TxID)
	response.Data = response.TxID
	response.Success = true
	logger.Info(response.Message)
	return response
}

// GetBalance of specified wallet address
func (bt *BusyToken) GetBalance(ctx contractapi.TransactionContextInterface, address string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	walletAsBytes, err := ctx.GetStub().GetState(address)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching balance: %s" + err.Error())
		logger.Error(response.Message)
		return response
	}
	if walletAsBytes == nil {
		response.Message = fmt.Sprintf("Address %s not found", address)
		logger.Error(response.Message)
		return response
	}
	var wallet Wallet
	_ = json.Unmarshal(walletAsBytes, &wallet)

	response.Message = fmt.Sprintf("Successfully fetched balance for address %s", address)
	response.Success = true
	response.Data = wallet.Balance
	logger.Info(response.Message)
	return response
}

// GetUser all the wallet and staking address of user with it's balance
func (bt *BusyToken) GetUser(ctx contractapi.TransactionContextInterface, userID string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	userAsBytes, err := ctx.GetStub().GetState(userID)
	if userAsBytes == nil {
		response.Message = fmt.Sprintf("User with common name %s doesn't exists", userID)
		logger.Info(response.Message)
		return response
	}
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user from blockchain: %s" + err.Error())
		logger.Error(response.Message)
		return response
	}

	var queryString string = fmt.Sprintf(`{
		"selector": {
			"userId": "%s"
		 } 
	}`, userID)
	resultIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user wallets: %s" + err.Error())
		logger.Error(response.Message)
		return response
	}
	defer resultIterator.Close()

	var wallet Wallet
	var responseData = map[string]Wallet{}
	for resultIterator.HasNext() {
		data, _ := resultIterator.Next()
		json.Unmarshal(data.Value, &wallet)
		responseData[wallet.Address] = wallet
	}

	response.Message = fmt.Sprintf("Successfully fetched balance for user %s", userID)
	response.Success = true
	response.Data = responseData
	logger.Info(response.Message)
	return response
}
