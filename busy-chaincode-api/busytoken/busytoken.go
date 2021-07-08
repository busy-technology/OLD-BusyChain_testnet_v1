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

	response.Message = fmt.Sprintf("User %s created", commonName)
	response.Success = true
	logger.Info(response.Message)
	return response
}

// CreateWallet create new wallet for user
func (bt *BusyToken) CreateWallet(ctx contractapi.TransactionContextInterface) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	utxo := UTXO{
		Address: response.TxID,
		Amount:  0.0,
		Token:   "Busy",
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	err := ctx.GetStub().PutState(response.TxID, utxoAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while creating new wallet address: %s" + err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = fmt.Sprintf("Address %s created", response.TxID)
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

	utxoAsBytes, err := ctx.GetStub().GetState(address)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching balance: %s" + err.Error())
		logger.Error(response.Message)
		return response
	}
	if utxoAsBytes == nil {
		response.Message = fmt.Sprintf("Address %s not found", address)
		logger.Error(response.Message)
		return response
	}
	var utxo UTXO
	_ = json.Unmarshal(utxoAsBytes, &utxo)

	response.Message = fmt.Sprintf("Successfully fetched balance for address %s", address)
	response.Success = true
	response.Data = utxo.Amount
	logger.Info(response.Message)
	return response
}
