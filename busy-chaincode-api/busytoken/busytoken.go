package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric/common/flogging"
)

// BusyToken chaincode
type BusyToken struct {
	contractapi.Contract
}

var logger = flogging.MustGetLogger("busy")

// Init Initialise chaincocode while deployment
func (bt *BusyToken) Init(ctx contractapi.TransactionContextInterface) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	mspid, _ := ctx.GetClientIdentity().GetMSPID()
	if mspid != "Org2MSP" {
		response.Message = "You are not allowed to issue busy coin"
		logger.Error(response.Message)
		return response
	}
	commonName, _ := getCommonName(ctx)
	if commonName != "org2admin" {
		response.Message = "You are not allowed to issue busy coin"
		logger.Error(response.Message)
		return response
	}

	token := Token{
		DocType:     "token",
		ID:          0,
		TokenName:   "Busy",
		TokenSymbol: "busy",
		Admin:       "admin",
		TotalSupply: 255_000000_000000_000000_000000,
	}
	tokenAsBytes, _ := json.Marshal(token)
	err := ctx.GetStub().PutState("busy", tokenAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating token on blockchain : %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	wallet := Wallet{
		DocType: "wallet",
		UserID:  "admin",
		Address: response.TxID,
		Balance: 255_000000_000000_000000_000000,
	}
	walletAsBytes, _ := json.Marshal(wallet)
	err = ctx.GetStub().PutState(response.TxID, walletAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	_ = ctx.GetStub().PutState("latestTokenId", []byte(strconv.Itoa(0)))

	user := User{
		DocType:       "user",
		UserID:        commonName,
		DefaultWallet: wallet.Address,
	}
	userAsBytes, _ := json.Marshal(user)
	err = ctx.GetStub().PutState(commonName, userAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	utxo := UTXO{
		DocType: "utxo",
		Address: wallet.Address,
		Amount:  255_000000_000000_000000_000000,
		Token:   "busy",
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	err = ctx.GetStub().PutState(fmt.Sprintf("%s~%s~%s", response.TxID, wallet.Address, token.TokenSymbol), utxoAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = fmt.Sprintf("Successfully issued token %s", "busy")
	response.Success = true
	response.Data = token
	logger.Info(response.Message)
	return response
}

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
		response.Message = fmt.Sprintf("Error while fetching user from blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	wallet := Wallet{
		DocType: "wallet",
		UserID:  commonName,
		Address: response.TxID,
		// Balance: 0.00,
	}
	walletAsBytes, _ := json.Marshal(wallet)
	err = ctx.GetStub().PutState(response.TxID, walletAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	// userID, _ := ctx.GetClientIdentity().GetID()
	user := User{
		DocType:       "user",
		UserID:        commonName,
		DefaultWallet: wallet.Address,
	}
	userAsBytes, _ = json.Marshal(user)
	err = ctx.GetStub().PutState(commonName, userAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = fmt.Sprintf("User %s created", commonName)
	response.Success = true
	response.Data = wallet.Address
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
		Address: "staking-" + response.TxID,
		Balance: 0.00,
	}
	stakingAddrAsBytes, _ := json.Marshal(stakingAddress)
	err := ctx.GetStub().PutState("staking-"+response.TxID, stakingAddrAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = fmt.Sprintf("Staking address %s created", stakingAddress.Address)
	response.Data = stakingAddress.Address
	response.Success = true
	logger.Info(response.Message)
	return response
}

// GetBalance of specified wallet address
func (bt *BusyToken) GetBalance(ctx contractapi.TransactionContextInterface, address string, token string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	if token == "" {
		token = "busy"
	}

	balance, err := getBalanceHelper(ctx, address, token)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching balance: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = fmt.Sprintf("Successfully fetched balance for address %s", address)
	response.Success = true
	response.Data = balance
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
		response.Message = fmt.Sprintf("Error while fetching user from blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	var queryString string = fmt.Sprintf(`{
		"selector": {
			"userId": "%s",
			"docType": {
				"$in": [
				   "wallet",
				   "stakingAddr"
				]
			}
		 } 
	}`, userID)
	resultIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user wallets: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	defer resultIterator.Close()

	var wallet Wallet
	var responseData = map[string]float64{}
	for resultIterator.HasNext() {
		data, _ := resultIterator.Next()
		json.Unmarshal(data.Value, &wallet)
		balance, _ := getBalanceHelper(ctx, wallet.Address, "busy")
		responseData[wallet.Address] = balance
	}

	response.Message = fmt.Sprintf("Successfully fetched balance for user %s", userID)
	response.Success = true
	response.Data = responseData
	logger.Info(response.Message)
	return response
}

// IssueToken issue token in default wallet address of invoker
func (bt *BusyToken) IssueToken(ctx contractapi.TransactionContextInterface, tokenName string, symbol string, amount float64) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	commonName, _ := getCommonName(ctx)
	var issueTokenFee float64 = 2500
	defaultWalletAddress, err := getDefaultWalletAddress(ctx, commonName)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user's default wallet: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	balance, err := getBalanceHelper(ctx, defaultWalletAddress, "busy")
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user balance: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if balance < issueTokenFee {
		response.Message = fmt.Sprintf("Your default wallet address %s must have %f busy coin to issue token", defaultWalletAddress, issueTokenFee)
		logger.Error(response.Message)
		return response
	}

	var token Token
	tokenAsBytes, err := ctx.GetStub().GetState(symbol)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching token details: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	tokenIdAsBytes, err := ctx.GetStub().GetState("latestTokenId")
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching latest token id: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	latestTokenID, _ := strconv.Atoi(string(tokenIdAsBytes))

	if tokenAsBytes == nil {
		var queryString string = fmt.Sprintf(`{
			"selector": {
				"docType": "token",
				"tokenName": "%s"
			 } 
		}`, tokenName)
		resultIterator, err := ctx.GetStub().GetQueryResult(queryString)
		if err != nil {
			response.Message = fmt.Sprintf("Error while fetching quering data: %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		defer resultIterator.Close()
		if resultIterator.HasNext() {
			response.Message = fmt.Sprintf("Token with name %s already issued by someone", tokenName)
			logger.Error(response.Message)
			return response
		}

		_ = ctx.GetStub().PutState("latestTokenId", []byte(strconv.Itoa(latestTokenID+1)))
		token := Token{
			DocType:     "token",
			ID:          uint64(latestTokenID + 1),
			TokenName:   tokenName,
			TokenSymbol: symbol,
			Admin:       commonName,
			TotalSupply: amount,
		}
		tokenAsBytes, _ = json.Marshal(token)
		err = ctx.GetStub().PutState(symbol, tokenAsBytes)
		if err != nil {
			response.Message = fmt.Sprintf("Error while updating token on blockchain : %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		response.Data = token
	} else {
		_ = json.Unmarshal(tokenAsBytes, &token)
		if token.TokenName != tokenName {
			response.Message = fmt.Sprintf("You must issue token with same name as before: %s", token.TokenName)
			logger.Error(response.Message)
			return response
		}
		token.TotalSupply = token.TotalSupply + amount
		tokenAsBytes, _ = json.Marshal(token)
		err = ctx.GetStub().PutState(symbol, tokenAsBytes)
		if err != nil {
			response.Message = fmt.Sprintf("Error while updating token on blockchain : %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		response.Data = token
	}

	var queryString string = fmt.Sprintf(`{
		"selector": {
			"userId": "%s",
			"docType": "wallet"
		 } 
	}`, commonName)
	resultIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching admin wallet: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	defer resultIterator.Close()

	var wallet Wallet
	if resultIterator.HasNext() {
		data, _ := resultIterator.Next()
		_ = json.Unmarshal(data.Value, &wallet)
		wallet.Balance += amount
		walletAsBytes, _ := json.Marshal(token)
		err = ctx.GetStub().PutState(symbol, walletAsBytes)
		if err != nil {
			response.Message = fmt.Sprintf("Error while updating wallet on blockchain : %s", err.Error())
			logger.Error(response.Message)
			return response
		}
	} else {
		if err != nil {
			response.Message = fmt.Sprintf("Can not issue token as wallet not found for user %s", commonName)
			logger.Error(response.Message)
			return response
		}
	}

	response.Message = fmt.Sprintf("Successfully issued token %s", symbol)
	response.Success = true
	logger.Info(response.Message)
	return response
}

// Transfer transfer given amount from invoker's identity to specified identity
func (bt *BusyToken) Transfer(ctx contractapi.TransactionContextInterface, recipiant string, amount float64, token string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	if token == "" {
		token = "busy"
	}
	sender, _ := getCommonName(ctx)
	userAsBytes, err := ctx.GetStub().GetState(sender)
	if userAsBytes == nil {
		response.Message = fmt.Sprintf("user %s doesn't exists", sender)
		logger.Error(response.Message)
		return response
	}
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	var user User
	_ = json.Unmarshal(userAsBytes, &user)

	isStakingAddress := strings.HasPrefix(recipiant, "staking-")
	if isStakingAddress {
		var wallet Wallet
		var queryString string = fmt.Sprintf(`{
			"selector": {
				"docType": "stakingAddr",
				"address": "%s"
			 } 
		}`, recipiant)
		resultIterator, err := ctx.GetStub().GetQueryResult(queryString)
		if err != nil {
			response.Message = fmt.Sprintf("Error while fetching user wallets: %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		defer resultIterator.Close()

		if resultIterator.HasNext() {
			data, _ := resultIterator.Next()
			json.Unmarshal(data.Value, &wallet)
			if wallet.UserID != sender {
				response.Message = fmt.Sprintf("You can not send funds to other user's staking address %s", recipiant)
				logger.Error(response.Message)
				return response
			}
		} else {
			response.Message = fmt.Sprintf("Staking address %s doesn't exists", recipiant)
			logger.Error(response.Message)
			return response
		}
	}

	err = transferHelper(ctx, user.DefaultWallet, recipiant, amount, token)
	if err != nil {
		response.Message = fmt.Sprintf("Error while transfer: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	response.Message = "succesfully transfered"
	logger.Info(response.Message)
	response.Success = true
	return response
}
