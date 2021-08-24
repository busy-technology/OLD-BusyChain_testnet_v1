package main

import (
	"encoding/json"
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric/common/flogging"
)

// BusyToken chaincode
type BusyToken struct {
	contractapi.Contract
}

var logger = flogging.MustGetLogger("busy")

const TRANSFER_FEE string = "1000000000000000"

// Init Initialise chaincocode while deployment
func (bt *BusyToken) Init(ctx contractapi.TransactionContextInterface) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	mspid, _ := ctx.GetClientIdentity().GetMSPID()
	if mspid != "BusyMSP" {
		response.Message = "You are not allowed to issue busy coin"
		logger.Error(response.Message)
		return response
	}
	commonName, _ := getCommonName(ctx)
	if commonName != "ordererAdmin" {
		response.Message = "You are not allowed to issue busy coin"
		logger.Error(response.Message)
		return response
	}
	// setting Message Config
	config := MessageConfig{
		BusyCoins:       "1",
		MessageInterval: 5 * time.Second,
	}
	configAsBytes, _ := json.Marshal(config)
	err := ctx.GetStub().PutState("MessageConfig", configAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	supply, _ := new(big.Int).SetString("255000000000000000000000000", 10)
	token := Token{
		DocType:     "token",
		ID:          0,
		TokenName:   "Busy",
		TokenSymbol: "busy",
		Admin:       commonName,
		TotalSupply: supply.String(),
	}
	tokenAsBytes, _ := json.Marshal(token)
	err = ctx.GetStub().PutState("busy", tokenAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating token on blockchain : %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	wallet := Wallet{
		DocType: "wallet",
		UserID:  commonName,
		Address: response.TxID,
		Balance: supply.String(),
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
		Amount:  supply.String(),
		Token:   "busy",
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	err = ctx.GetStub().PutState(fmt.Sprintf("%s~%s~%s", response.TxID, wallet.Address, token.TokenSymbol), utxoAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	err = ctx.GetStub().PutState("transferFees", []byte(TRANSFER_FEE))
	if err != nil {
		response.Message = fmt.Sprintf("Error while configuring transfer fee: %s", err.Error())
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
	phase1StakingAmount, _ := new(big.Int).SetString("1000", 10)
	// bigZero, _ := new(big.Int).SetString("0", 10)
	commonName, _ := getCommonName(ctx)
	defaultWalletAddress, _ := getDefaultWalletAddress(ctx, commonName)
	stakingAddress := Wallet{
		DocType: "stakingAddr",
		UserID:  commonName,
		Address: "staking-" + response.TxID,
		Balance: bigZero.String(),
	}
	err := transferHelper(ctx, defaultWalletAddress, stakingAddress.Address, phase1StakingAmount, "busy", bigZero)
	if err != nil {
		response.Message = fmt.Sprintf("Error while transfer from default wallet to staking address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	stakingAddrAsBytes, _ := json.Marshal(stakingAddress)
	err = ctx.GetStub().PutState("staking-"+response.TxID, stakingAddrAsBytes)
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
	var responseData = map[string]*big.Int{}
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
func (bt *BusyToken) IssueToken(ctx contractapi.TransactionContextInterface, tokenName string, symbol string, amount string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	bigAmount, _ := new(big.Int).SetString(amount, 10)
	commonName, _ := getCommonName(ctx)
	issueTokenFee, _ := new(big.Int).SetString("2500", 10)
	minusOne, _ := new(big.Int).SetString("-1", 10)
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
	if balance.Cmp(issueTokenFee) == -1 {
		response.Message = fmt.Sprintf("Your default wallet address %s must have %f busy coin to issue token", defaultWalletAddress, issueTokenFee)
		logger.Error(response.Message)
		return response
	}

	err = addUTXO(ctx, defaultWalletAddress, issueTokenFee.Mul(issueTokenFee, minusOne), "busy")
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning fees for issue token: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	err = updateTotalSupply(ctx, "busy", issueTokenFee.Mul(issueTokenFee, minusOne))
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning issue token fee from total supply: %s", err.Error())
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
			TotalSupply: bigAmount.String(),
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
		bigTotalSupply, _ := new(big.Int).SetString(token.TotalSupply, 10)
		token.TotalSupply = bigTotalSupply.Add(bigTotalSupply, bigAmount).String()
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

	issuerAddress, _ := getDefaultWalletAddress(ctx, commonName)
	err = addUTXO(ctx, issuerAddress, bigAmount, symbol)
	if err != nil {
		response.Message = fmt.Sprintf("Error while generating utxo for new token: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	// var wallet Wallet
	// if resultIterator.HasNext() {
	// 	data, _ := resultIterator.Next()
	// 	_ = json.Unmarshal(data.Value, &wallet)
	// 	wallet.Balance += amount
	// 	walletAsBytes, _ := json.Marshal(token)
	// 	err = ctx.GetStub().PutState(symbol, walletAsBytes)
	// 	if err != nil {
	// 		response.Message = fmt.Sprintf("Error while updating wallet on blockchain : %s", err.Error())
	// 		logger.Error(response.Message)
	// 		return response
	// 	}
	// } else {
	// 	if err != nil {
	// 		response.Message = fmt.Sprintf("Can not issue token as wallet not found for user %s", commonName)
	// 		logger.Error(response.Message)
	// 		return response
	// 	}
	// }

	response.Message = fmt.Sprintf("Successfully issued token %s", symbol)
	response.Success = true
	logger.Info(response.Message)
	return response
}

// Transfer transfer given amount from invoker's identity to specified identity
func (bt *BusyToken) Transfer(ctx contractapi.TransactionContextInterface, recipiant string, amount string, token string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	// check if wallet already exists
	walletAsBytes, err := ctx.GetStub().GetState(recipiant)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching wallet %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if walletAsBytes == nil {
		response.Message = fmt.Sprintf("Wallet with address %s doesn't exists", recipiant)
		logger.Error(response.Message)
		return response
	}

	// Fetch current transfer fee
	transferFeesAsBytes, err := ctx.GetStub().GetState("transferFees")
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching transfer fee %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	bigTransferFee, _ := new(big.Int).SetString(string(transferFeesAsBytes), 10)

	bigAmount, _ := new(big.Int).SetString(amount, 10)
	// bigAmountWithTransferFee := bigAmount.Add(bigAmount, bigTransferFee)
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

	if user.DefaultWallet == recipiant {
		response.Message = "can't transfet to same address"
		logger.Error(response.Message)
		return response
	}
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

	err = transferHelper(ctx, user.DefaultWallet, recipiant, bigAmount, token, bigTransferFee)
	if err != nil {
		response.Message = fmt.Sprintf("Error while transfer: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	minusOne, _ := new(big.Int).SetString("-1", 10)
	err = updateTotalSupply(ctx, "busy", bigTransferFee.Mul(bigTransferFee, minusOne))
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning transfer fee: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = "succesfully transfered"
	logger.Info(response.Message)
	response.Success = true
	return response
}

// GetTotalSupply get total supply of specified token
func (bt *BusyToken) GetTotalSupply(ctx contractapi.TransactionContextInterface, symbol string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	if symbol == "" {
		symbol = "busy"
	}
	var token Token
	tokenAsBytes, err := ctx.GetStub().GetState(symbol)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching token details: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	_ = json.Unmarshal(tokenAsBytes, &token)

	response.Message = "succesfully fetched total supply"
	logger.Info(response.Message)
	response.Data = token.TotalSupply
	response.Success = true
	return response
}

// Burn reduct balance from user wallet and reduce total supply
func (bt *BusyToken) Burn(ctx contractapi.TransactionContextInterface, address string, amount string, symbol string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	// check if wallet already exists
	walletAsBytes, err := ctx.GetStub().GetState(address)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching wallet %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if walletAsBytes == nil {
		response.Message = fmt.Sprintf("Wallet with address %s doesn't exists", address)
		logger.Error(response.Message)
		return response
	}

	balance, err := getBalanceHelper(ctx, address, "busy")
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching balance %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	bigAmount, _ := new(big.Int).SetString(amount, 10)
	if balance.Cmp(bigAmount) == -1 {
		response.Message = fmt.Sprintf("Not enough balance %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	negetiveBigAmount, _ := new(big.Int).SetString("-"+amount, 10)
	mspid, _ := ctx.GetClientIdentity().GetMSPID()
	if mspid != "BusyMSP" {
		response.Message = "You are not allowed to issue busy coin"
		logger.Error(response.Message)
		return response
	}
	commonName, _ := getCommonName(ctx)
	if commonName != "ordererAdmin" {
		response.Message = "You are not allowed to issue busy coin"
		logger.Error(response.Message)
		return response
	}

	var token Token
	tokenAsBytes, err := ctx.GetStub().GetState(symbol)
	if tokenAsBytes == nil {
		response.Message = fmt.Sprintf("Token %s doesn't exists", symbol)
		logger.Error(response.Message)
		return response
	}
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching token details: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	_ = json.Unmarshal(tokenAsBytes, &token)
	bigTotalSupply, _ := new(big.Int).SetString(token.TotalSupply, 10)
	token.TotalSupply = bigTotalSupply.Sub(bigTotalSupply, bigAmount).String()
	tokenAsBytes, _ = json.Marshal(token)
	err = ctx.GetStub().PutState(symbol, tokenAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating total supply: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	err = addUTXO(ctx, address, negetiveBigAmount, symbol)
	if err != nil {
		response.Message = fmt.Sprintf("Error while burn token: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = "succesfully burnt token"
	logger.Info(response.Message)
	response.Success = true
	return response
}

// multibeneficiaryVestingV1 vesting v1
func (bt *BusyToken) MultibeneficiaryVestingV1(ctx contractapi.TransactionContextInterface, recipient string, amount string, numerator uint64, denominator uint64, releaseAt uint64) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	// check if wallet already exists
	walletAsBytes, err := ctx.GetStub().GetState(recipient)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching wallet %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if walletAsBytes == nil {
		response.Message = fmt.Sprintf("Wallet with address %s doesn't exists", recipient)
		logger.Error(response.Message)
		return response
	}

	now, _ := ctx.GetStub().GetTxTimestamp()
	mspid, _ := ctx.GetClientIdentity().GetMSPID()
	if mspid != "BusyMSP" {
		response.Message = "You are not allowed to add vesting schedule"
		logger.Error(response.Message)
		return response
	}
	commonName, _ := getCommonName(ctx)
	if commonName != "ordererAdmin" {
		response.Message = "You are not allowed to add vesting schedule"
		logger.Error(response.Message)
		return response
	}
	bigAmount, _ := new(big.Int).SetString(amount, 10)
	if bigAmount.Cmp(bigZero) == 0 {
		response.Message = "Amount should not be equal to zero"
		logger.Error(response.Message)
		return response
	}
	adminAddress, _ := getDefaultWalletAddress(ctx, commonName)
	balance, _ := getBalanceHelper(ctx, adminAddress, "busy")
	if balance.Cmp(bigAmount) == -1 {
		response.Message = "Not enough balance"
		logger.Error(response.Message)
		return response
	}

	lockedTokenAsBytes, _ := ctx.GetStub().GetState(fmt.Sprintf("vesting~%s", recipient))
	if lockedTokenAsBytes != nil {
		response.Message = fmt.Sprintf("Vesting entry for address %s already exists", recipient)
		logger.Error(response.Message)
		return response
	}
	if releaseAt < uint64(now.Seconds) {
		response.Message = "release time must be in future"
		logger.Error(response.Message)
		return response
	}

	totalAmount := new(big.Int).Set(bigAmount)
	currentVesting := calculatePercentage(bigAmount, numerator, denominator)

	err = transferHelper(ctx, adminAddress, recipient, currentVesting, "busy", bigZero)
	if err != nil {
		response.Message = fmt.Sprintf("Error while transfer: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	lockedToken := LockedTokens{
		DocType:        "lockedToken",
		TotalAmount:    totalAmount.String(),
		ReleasedAmount: currentVesting.String(),
		StartedAt:      uint64(now.Seconds),
		ReleaseAt:      releaseAt,
	}
	lockedTokenAsBytes, _ = json.Marshal(lockedToken)
	err = ctx.GetStub().PutState(fmt.Sprintf("vesting~%s", recipient), lockedTokenAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while adding vesting schedule: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = "succesfully added vesting schedule"
	logger.Info(response.Message)
	response.Success = true
	return response
}

// multibeneficiaryVestingV2 vesting v2
func (bt *BusyToken) MultibeneficiaryVestingV2(ctx contractapi.TransactionContextInterface, recipient string, amount string, startAt uint64, releaseAt uint64) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	// check if wallet already exists
	walletAsBytes, err := ctx.GetStub().GetState(recipient)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching wallet %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if walletAsBytes == nil {
		response.Message = fmt.Sprintf("Wallet with address %s doesn't exists", recipient)
		logger.Error(response.Message)
		return response
	}

	now, _ := ctx.GetStub().GetTxTimestamp()
	mspid, _ := ctx.GetClientIdentity().GetMSPID()
	if mspid != "BusyMSP" {
		response.Message = "You are not allowed to add vesting schedule"
		logger.Error(response.Message)
		return response
	}
	commonName, _ := getCommonName(ctx)
	if commonName != "ordererAdmin" {
		response.Message = "You are not allowed to add vesting schedule"
		logger.Error(response.Message)
		return response
	}
	bigAmount, _ := new(big.Int).SetString(amount, 10)
	if bigAmount.Cmp(bigZero) == 0 {
		response.Message = "Amount should not be equal to zero"
		logger.Error(response.Message)
		return response
	}
	adminAddress, _ := getDefaultWalletAddress(ctx, commonName)
	balance, _ := getBalanceHelper(ctx, adminAddress, "busy")
	if balance.Cmp(bigAmount) == -1 {
		response.Message = "Not enough balance"
		logger.Error(response.Message)
		return response
	}
	if releaseAt < startAt {
		response.Message = "Release time must be greater then start time"
		logger.Error(response.Message)
		return response
	}

	lockedTokenAsBytes, _ := ctx.GetStub().GetState(fmt.Sprintf("vesting~%s", recipient))
	if lockedTokenAsBytes != nil {
		response.Message = fmt.Sprintf("Vesting entry for address %s already exists", recipient)
		logger.Error(response.Message)
		return response
	}
	if releaseAt < uint64(now.Seconds) {
		response.Message = "release time must be in future"
		logger.Error(response.Message)
		return response
	}

	totalAmount := new(big.Int).Set(bigAmount)
	lockedToken := LockedTokens{
		DocType:        "lockedToken",
		TotalAmount:    totalAmount.String(),
		ReleasedAmount: "0",
		StartedAt:      uint64(now.Seconds),
		ReleaseAt:      releaseAt,
	}
	lockedTokenAsBytes, _ = json.Marshal(lockedToken)
	err = ctx.GetStub().PutState(fmt.Sprintf("vesting~%s", recipient), lockedTokenAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while adding vesting schedule: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = "succesfully added vesting schedule"
	logger.Info(response.Message)
	response.Success = true
	return response
}

// GetLockedTokens get entry of vesting schedule for wallet address
func (bt *BusyToken) GetLockedTokens(ctx contractapi.TransactionContextInterface, address string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	lockedTokenAsBytes, err := ctx.GetStub().GetState(fmt.Sprintf("vesting~%s", address))
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting vesting entry: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if lockedTokenAsBytes == nil {
		response.Message = fmt.Sprintf("Vesting entry doesn't exists for address %s", address)
		logger.Error(response.Message)
		return response
	}
	var lockedToken LockedTokens
	_ = json.Unmarshal(lockedTokenAsBytes, &lockedToken)

	response.Message = "succesfully feteched vesting entry"
	logger.Info(response.Message)
	response.Data = lockedToken
	response.Success = true
	return response
}

// AttemptUnlock
func (bt *BusyToken) AttemptUnlock(ctx contractapi.TransactionContextInterface) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	commonName, _ := getCommonName(ctx)
	now, _ := ctx.GetStub().GetTxTimestamp()
	walletAddress, err := getDefaultWalletAddress(ctx, commonName)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching default wallet address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	lockedTokenAsBytes, err := ctx.GetStub().GetState(fmt.Sprintf("vesting~%s", walletAddress))
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting vesting entry: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if lockedTokenAsBytes == nil {
		response.Message = fmt.Sprintf("Vesting entry doesn't exists for address %s", walletAddress)
		logger.Error(response.Message)
		return response
	}
	var lockedToken LockedTokens
	_ = json.Unmarshal(lockedTokenAsBytes, &lockedToken)
	bigTotalAmount, _ := new(big.Int).SetString(lockedToken.TotalAmount, 10)
	bigReleasedAmount, _ := new(big.Int).SetString(lockedToken.ReleasedAmount, 10)
	bigStartedAt := new(big.Int).SetUint64(lockedToken.StartedAt)
	bigReleasedAt := new(big.Int).SetUint64(lockedToken.ReleaseAt)
	bigNow := new(big.Int).SetUint64(uint64(now.Seconds))

	if lockedToken.StartedAt > uint64(now.Seconds) {
		response.Message = fmt.Sprintf("Vesting period not yet started for address %s", walletAddress)
		logger.Error(response.Message)
		return response
	}
	if lockedToken.ReleaseAt <= uint64(now.Seconds) {
		if lockedToken.TotalAmount == lockedToken.ReleasedAmount {
			response.Message = fmt.Sprintf("All tokens are unlocked for address %s", walletAddress)
			logger.Error(response.Message)
			return response
		}
		amountToReleaseNow := bigTotalAmount.Sub(bigTotalAmount, bigReleasedAmount)
		lockedToken.ReleasedAmount = lockedToken.TotalAmount
		err = addUTXO(ctx, walletAddress, amountToReleaseNow, "busy")
		if err != nil {
			response.Message = fmt.Sprintf("Error while claim: %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		lockedTokenAsBytes, _ := json.Marshal(lockedToken)
		err = ctx.GetStub().PutState(fmt.Sprintf("vesting~%s", walletAddress), lockedTokenAsBytes)
		if err != nil {
			response.Message = fmt.Sprintf("Error while updating vesting entry: %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		response.Message = fmt.Sprintf("All tokens are unlocked for address %s", walletAddress)
		logger.Error(response.Message)
		return response
	}
	releasableAmount := bigTotalAmount.Mul(bigNow.Sub(bigNow, bigStartedAt), bigTotalAmount).Div(bigTotalAmount, bigReleasedAt.Sub(bigReleasedAt, bigStartedAt))
	if releasableAmount.String() == "0" {
		response.Message = "Nothing to release at this time"
		logger.Error(response.Message)
		return response
	}
	if releasableAmount.Cmp(bigTotalAmount) == 1 {
		response.Message = "Nothing to release at this time"
		logger.Error(response.Message)
		return response
	}
	releasableAmount = releasableAmount.Sub(releasableAmount, bigReleasedAmount)
	addUTXO(ctx, walletAddress, releasableAmount, "busy")
	if err != nil {
		response.Message = fmt.Sprintf("Error while claim: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	bigReleasedAmount = bigReleasedAmount.Add(bigReleasedAmount, releasableAmount)
	lockedToken.ReleasedAmount = bigReleasedAmount.String()
	lockedTokenAsBytes, _ = json.Marshal(lockedToken)
	err = ctx.GetStub().PutState(fmt.Sprintf("vesting~%s", walletAddress), lockedTokenAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating vesting entry: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	response.Message = fmt.Sprintf("Tokens are unlocked for address %s", walletAddress)
	response.Success = true
	logger.Error(response.Message)
	return response
}

func (bt *BusyToken) UpdateTransferFee(ctx contractapi.TransactionContextInterface, newTransferFee string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	mspid, _ := ctx.GetClientIdentity().GetMSPID()
	if mspid != "BusyMSP" {
		response.Message = "You are not allowed to set the transaction fees."
		logger.Error(response.Message)
		return response
	}
	commonName, _ := getCommonName(ctx)
	if commonName != "ordererAdmin" {
		response.Message = "You are not allowed to set the transaction fees."
		logger.Error(response.Message)
		return response
	}

	err := ctx.GetStub().PutState("transferFees", []byte(newTransferFee))
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating transfer fee: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = "transfer fee updated successfully"
	response.Success = true
	response.Data = newTransferFee
	logger.Error(response.Message)
	return response
}
