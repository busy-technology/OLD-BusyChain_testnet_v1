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

// Busy chaincode
type Busy struct {
	contractapi.Contract
}

var logger = flogging.MustGetLogger("busy")

const TRANSFER_FEE string = "1000000000000000"
const ISSUE_TOKEN_FEE string = "2500000000000000000000"
const PHASE1_STAKING_AMOUNT = "1000000000000000000000"

// Init Initialise chaincocode while deployment
func (bt *Busy) Init(ctx contractapi.TransactionContextInterface) Response {
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
		BigBusyCoins:    "1000000000000000000",
		BusyCoin:        1,
		MessageInterval: 5 * time.Second,
	}
	configAsBytes, _ := json.Marshal(config)
	err := ctx.GetStub().PutState("MessageConfig", configAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	// setting Voting Config
	votingConfig := VotingConfig{
		MinimumCoins:    "10000000000000000000000000",
		PoolFee:         "166666000000000000000000",
		VotingPeriod:    20 * time.Minute, // 7 days + 2 days
		VotingStartTime: 5 * time.Minute,
	}
	votingConfigAsBytes, _ := json.Marshal(votingConfig)
	err = ctx.GetStub().PutState("VotingConfig", votingConfigAsBytes)
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
		Decimals:    18,
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

	currentStakingLimit, _ := new(big.Int).SetString(PHASE1_STAKING_AMOUNT, 10)
	phaseConfig := PhaseConfig{
		CurrentPhase:          1,
		TotalStakingAddr:      bigZero.String(),
		NextStakingAddrTarget: "10",
		CurrentStakingLimit:   currentStakingLimit.String(),
	}
	phaseConfigAsBytes, _ := json.Marshal(phaseConfig)
	err = ctx.GetStub().PutState("phaseConfig", phaseConfigAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while initialising phase config: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	now, _ := ctx.GetStub().GetTxTimestamp()
	phaseUpdateTimeline := map[uint64]uint64{
		1: uint64(now.Seconds),
	}
	// phaseUpdateTimelineAsBytes, err := ctx.GetStub().GetState(PHASE_UPDATE_TIMELINE)
	// _ = json.Unmarshal(phaseUpdateTimelineAsBytes, &phaseUpdateTimeline)
	// phaseUpdateTimeline[phaseConfig.CurrentPhase] = uint64(now.Seconds)
	phaseUpdateTimelineAsBytes, _ := json.Marshal(phaseUpdateTimeline)
	err = ctx.GetStub().PutState(PHASE_UPDATE_TIMELINE, phaseUpdateTimelineAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while initialising phase timeline: %s", err.Error())
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
func (bt *Busy) CreateUser(ctx contractapi.TransactionContextInterface) Response {
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
		Address: "B-" + response.TxID,
		// Balance: 0.00,
	}
	walletAsBytes, _ := json.Marshal(wallet)
	err = ctx.GetStub().PutState("B-"+response.TxID, walletAsBytes)
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
		MessageCoins: map[string]int{
			"totalCoins": 0,
		},
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
func (bt *Busy) CreateStakingAddress(ctx contractapi.TransactionContextInterface) Response {
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
	currentPhaseConfig, err := getPhaseConfig(ctx)
	fmt.Println(currentPhaseConfig)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting phase config: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	now, _ := ctx.GetStub().GetTxTimestamp()

	fmt.Println(currentPhaseConfig.CurrentStakingLimit)
	stakingAmount, _ := new(big.Int).SetString(currentPhaseConfig.CurrentStakingLimit, 10)
	// bigZero, _ := new(big.Int).SetString("0", 10)
	commonName, _ := getCommonName(ctx)
	defaultWalletAddress, _ := getDefaultWalletAddress(ctx, commonName)
	stakingAddress := Wallet{
		DocType: "stakingAddr",
		UserID:  commonName,
		Address: "staking-" + response.TxID,
		Balance: stakingAmount.String(),
	}
	txFee, err := getCurrentTxFee(ctx)
	bigTxFee, _ := new(big.Int).SetString(txFee, 10)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting tx fee: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	err = transferHelper(ctx, defaultWalletAddress, stakingAddress.Address, stakingAmount, "busy", new(big.Int).Set(bigTxFee))
	if err != nil {
		response.Message = fmt.Sprintf("Error while transfer from default wallet to staking address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	err = updateTotalSupply(ctx, "busy", new(big.Int).Set(bigTxFee))
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning transfer fee: %s", err.Error())
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

	stakingInfo := StakingInfo{
		DocType:        "stakingInfo",
		StakingAddress: stakingAddress.Address,
		Amount:         stakingAddress.Balance,
		TimeStamp:      uint64(now.Seconds),
		Phase:          currentPhaseConfig.CurrentPhase,
		TotalReward:    bigZero.String(),
		Claimed:        bigZero.String(),
	}
	stakingInfoAsBytes, _ := json.Marshal(stakingInfo)
	err = ctx.GetStub().PutState(fmt.Sprintf("info~%s", stakingAddress.Address), stakingInfoAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating staking info in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	_, err = updatePhase(ctx)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating phase: %s", err.Error())
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
func (bt *Busy) GetBalance(ctx contractapi.TransactionContextInterface, address string, token string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	if token == "" {
		token = "busy"
	}
	exists, err := ifTokenExists(ctx, token)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching token details: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if !exists {
		response.Message = fmt.Sprintf("Token %s doesn't exists", token)
		logger.Error(response.Message)
		return response
	}

	balance, err := getBalanceHelper(ctx, address, token)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching balance: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = fmt.Sprintf("Successfully fetched balance for address %s", address)
	response.Success = true
	response.Data = fmt.Sprintf("%s %s", balance.String(), token)
	logger.Info(response.Message)
	return response
}

// GetUser all the wallet and staking address of user with it's balance
func (bt *Busy) GetUser(ctx contractapi.TransactionContextInterface, userID string) Response {
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

	userDetails := User{}
	if err := json.Unmarshal(userAsBytes, &userDetails); err != nil {
		response.Message = fmt.Sprintf("Error while retrieving the sender details %s", err.Error())
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
	responseData := map[string]interface{}{}
	for resultIterator.HasNext() {
		data, _ := resultIterator.Next()
		json.Unmarshal(data.Value, &wallet)
		balance, _ := getBalanceHelper(ctx, wallet.Address, "busy")
		responseData[wallet.Address] = fmt.Sprintf("%s %s", balance.String(), "busy")
	}

	responseData["messageCoins"] = userDetails.MessageCoins
	response.Message = fmt.Sprintf("Successfully fetched balance for user %s", userID)
	response.Success = true
	response.Data = responseData
	logger.Info(response.Message)
	return response
}

// IssueToken issue token in default wallet address of invoker
func (bt *Busy) IssueToken(ctx contractapi.TransactionContextInterface, tokenName string, symbol string, amount string, decimals uint64) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	if amount == "0" {
		response.Message = "can't issue zero amount"
		logger.Error(response.Message)
		return response
	}

	bigAmount, _ := new(big.Int).SetString(amount, 10)
	commonName, _ := getCommonName(ctx)
	issueTokenFee, _ := new(big.Int).SetString(ISSUE_TOKEN_FEE, 10)
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
			Decimals:    decimals,
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
		// _ = json.Unmarshal(tokenAsBytes, &token)
		// if token.TokenName != tokenName {
		// 	response.Message = fmt.Sprintf("You must issue token with same name as before: %s", token.TokenName)
		// 	logger.Error(response.Message)
		// 	return response
		// }
		// bigTotalSupply, _ := new(big.Int).SetString(token.TotalSupply, 10)
		// token.TotalSupply = bigTotalSupply.Add(bigTotalSupply, bigAmount).String()
		// tokenAsBytes, _ = json.Marshal(token)
		// err = ctx.GetStub().PutState(symbol, tokenAsBytes)
		// if err != nil {
		// 	response.Message = fmt.Sprintf("Error while updating token on blockchain : %s", err.Error())
		// 	logger.Error(response.Message)
		// 	return response
		// }
		// response.Data = token
		response.Message = fmt.Sprintf("Token with symbol %s already issued", token.TokenSymbol)
		logger.Error(response.Message)
		return response
	}

	// var queryString string = fmt.Sprintf(`{
	// 	"selector": {
	// 		"userId": "%s",
	// 		"docType": "wallet"
	// 	 }
	// }`, commonName)
	// resultIterator, err := ctx.GetStub().GetQueryResult(queryString)
	// if err != nil {
	// 	response.Message = fmt.Sprintf("Error while fetching admin wallet: %s", err.Error())
	// 	logger.Error(response.Message)
	// 	return response
	// }
	// defer resultIterator.Close()

	issuerAddress, _ := getDefaultWalletAddress(ctx, commonName)
	err = addUTXO(ctx, issuerAddress, bigAmount, symbol)
	if err != nil {
		response.Message = fmt.Sprintf("Error while generating utxo for new token: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	err = addUTXO(ctx, defaultWalletAddress, new(big.Int).Set(issueTokenFee).Mul(issueTokenFee, minusOne), "busy")
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning fees for issue token: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	err = updateTotalSupply(ctx, "busy", new(big.Int).Set(issueTokenFee))
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning issue token fee from total supply: %s", err.Error())
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
func (bt *Busy) Transfer(ctx contractapi.TransactionContextInterface, recipiant string, amount string, token string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	if amount == "0" {
		response.Message = "can't transfer zero amount"
		logger.Error(response.Message)
		return response
	}

	// check if token exists
	exists, err := ifTokenExists(ctx, token)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching token details: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if !exists {
		response.Message = fmt.Sprintf("Token %s doesn't exists", token)
		logger.Error(response.Message)
		return response
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

	if bigAmount == nil {
		response.Message = fmt.Sprintf("Invalid or empty amount provided, amount should be string")
		logger.Error(response.Message)
		return response
	}
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
	// minusOne, _ := new(big.Int).SetString("-1", 10)
	err = updateTotalSupply(ctx, "busy", bigTransferFee)
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
func (bt *Busy) GetTotalSupply(ctx contractapi.TransactionContextInterface, symbol string) Response {
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
	if tokenAsBytes == nil {
		response.Message = fmt.Sprintf("Token %s doesn't exists", symbol)
		logger.Error(response.Message)
		return response
	}
	_ = json.Unmarshal(tokenAsBytes, &token)

	response.Message = "succesfully fetched total supply"
	logger.Info(response.Message)
	response.Data = fmt.Sprintf("%s %s", token.TotalSupply, symbol)
	response.Success = true
	return response
}

// Burn reduct balance from user wallet and reduce total supply
func (bt *Busy) Burn(ctx contractapi.TransactionContextInterface, address string, amount string, symbol string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	if amount == "0" {
		response.Message = "can't burn zero amount"
		logger.Error(response.Message)
		return response
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

	balance, err := getBalanceHelper(ctx, address, symbol)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching balance %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	bigAmount, _ := new(big.Int).SetString(amount, 10)
	if balance.Cmp(bigAmount) == -1 {
		response.Message = fmt.Sprintf("Not enough balance in the wallet")
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

	defaultWalletAddress, err := getDefaultWalletAddress(ctx, commonName)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting default wallet address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	err = burnTxFee(ctx, defaultWalletAddress, "busy")
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning tx fee: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = "succesfully burnt token"
	logger.Info(response.Message)
	response.Success = true
	return response
}

// multibeneficiaryVestingV1 vesting v1
func (bt *Busy) MultibeneficiaryVestingV1(ctx contractapi.TransactionContextInterface, recipient string, amount string, numerator uint64, denominator uint64, releaseAt uint64) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	if amount == "0" {
		response.Message = "can't vest zero amount"
		logger.Error(response.Message)
		return response
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

	txFee, err := getCurrentTxFee(ctx)
	bigTxFee, _ := new(big.Int).SetString(txFee, 10)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting tx fee: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	err = transferHelper(ctx, adminAddress, recipient, currentVesting, "busy", new(big.Int).Set(bigTxFee))
	if err != nil {
		response.Message = fmt.Sprintf("Error while transfer: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	err = updateTotalSupply(ctx, "busy", new(big.Int).Set(bigTxFee))
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning transfer fee: %s", err.Error())
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
func (bt *Busy) MultibeneficiaryVestingV2(ctx contractapi.TransactionContextInterface, recipient string, amount string, startAt uint64, releaseAt uint64) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	if amount == "0" {
		response.Message = "can't vest zero amount"
		logger.Error(response.Message)
		return response
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
	sender, _ := getCommonName(ctx)
	defaultWalletAddress, err := getDefaultWalletAddress(ctx, sender)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting default wallet address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	err = burnTxFee(ctx, defaultWalletAddress, "busy")
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning tx fee: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = "succesfully added vesting schedule"
	logger.Info(response.Message)
	response.Success = true
	return response
}

// GetLockedTokens get entry of vesting schedule for wallet address
func (bt *Busy) GetLockedTokens(ctx contractapi.TransactionContextInterface, address string) Response {
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
func (bt *Busy) AttemptUnlock(ctx contractapi.TransactionContextInterface) Response {
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

	err = burnTxFee(ctx, walletAddress, "busy")
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning tx fee: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = fmt.Sprintf("Tokens are unlocked for address %s", walletAddress)
	response.Success = true
	logger.Error(response.Message)
	return response
}

func (bt *Busy) UpdateTransferFee(ctx contractapi.TransactionContextInterface, newTransferFee string) Response {
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

	sender, _ := getCommonName(ctx)
	defaultWalletAddress, err := getDefaultWalletAddress(ctx, sender)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting default wallet address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	err = burnTxFee(ctx, defaultWalletAddress, "busy")
	if err != nil {
		response.Message = fmt.Sprintf("Error while burning tx fee: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = "transfer fee updated successfully"
	response.Success = true
	response.Data = newTransferFee
	logger.Error(response.Message)
	return response
}

func (bt *Busy) GetTokenDetails(ctx contractapi.TransactionContextInterface, tokenSymbol string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	tokenAsBytes, err := ctx.GetStub().GetState(tokenSymbol)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching token details: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if tokenAsBytes == nil {
		response.Message = fmt.Sprintf("Token with symbol %s not found", tokenSymbol)
		logger.Error(response.Message)
		return response
	}
	var token Token
	_ = json.Unmarshal(tokenAsBytes, &token)

	response.Message = "successfully fetched token"
	response.Success = true
	response.Data = token
	logger.Info(response.Message)
	return response
}

func (bt *Busy) GetStakingInfo(ctx contractapi.TransactionContextInterface, userID string) Response {
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

	userDetails := User{}
	if err := json.Unmarshal(userAsBytes, &userDetails); err != nil {
		response.Message = fmt.Sprintf("Error while retrieving the sender details %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	var queryString string = fmt.Sprintf(`{
		"selector": {
			"userId": "%s",
			"docType": "stakingAddr"
		 } 
	}`, userID)
	resultIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user wallets: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	defer resultIterator.Close()

	var stakingAddr Wallet
	responseData := map[string]interface{}{}
	for resultIterator.HasNext() {
		tmpData := map[string]string{}
		data, _ := resultIterator.Next()
		json.Unmarshal(data.Value, &stakingAddr)
		stakingInfo, _ := getStakingInfo(ctx, stakingAddr.Address)
		tmpData["claimed"] = stakingInfo.Claimed
		reward, err := countStakingReward(ctx, stakingInfo.StakingAddress)
		if err != nil {
			response.Message = fmt.Sprintf("Error while counting staking reward: %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		tmpData["totalReward"] = reward.String()
		responseData[stakingAddr.Address] = tmpData
	}

	response.Message = fmt.Sprintf("Successfully fetched staking info for user %s", userID)
	response.Success = true
	response.Data = responseData
	logger.Info(response.Message)
	return response
}

func (bt *Busy) Claim(ctx contractapi.TransactionContextInterface, stakingAddr string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	commonName, _ := getCommonName(ctx)
	fee, _ := getCurrentTxFee(ctx)
	bigFee, _ := new(big.Int).SetString(fee, 10)
	defaultWalletAddress, err := getDefaultWalletAddress(ctx, commonName)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting default wallet address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	balance, _ := getBalanceHelper(ctx, defaultWalletAddress, BUSY_COIN_SYMBOL)
	if bigFee.Cmp(balance) == 1 {
		response.Message = "Not enough balance for tx fee"
		logger.Error(response.Message)
		return response
	}

	stakingAddrAsBytes, err := ctx.GetStub().GetState(stakingAddr)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching staking address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if stakingAddrAsBytes == nil {
		response.Message = fmt.Sprintf("Staking address %s not found", stakingAddr)
		logger.Error(response.Message)
		return response
	}
	var stAddr Wallet
	json.Unmarshal(stakingAddrAsBytes, &stAddr)
	if stAddr.UserID != commonName {
		response.Message = "you're not owner of staking address"
		logger.Error(response.Message)
		return response
	}

	stakingReward, err := countStakingReward(ctx, stakingAddr)
	if err != nil {
		response.Message = fmt.Sprintf("Error while couting staking reward: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	logger.Infof("staking reward counted from countStakingReward func %s", stakingReward.String())

	stakingInfoAsBytes, err := ctx.GetStub().GetState(fmt.Sprintf("info~%s", stakingAddr))
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching staking info: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	var stakingInfo StakingInfo
	_ = json.Unmarshal(stakingInfoAsBytes, &stakingInfo)

	currentPhaseConfig, err := getPhaseConfig(ctx)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting phase config: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	// adminWalletAddress, _ := getDefaultWalletAddress(ctx, ADMIN_USER_ID)
	bigClaimedAmount, _ := new(big.Int).SetString(stakingInfo.Claimed, 10)
	logger.Info("Amout user claimed already fetching from staking info %s", bigClaimedAmount.String())
	claimableAmount := new(big.Int).Set(stakingReward).Sub(stakingReward, bigClaimedAmount)
	logger.Infof("claimable amout %s after deducting claimed amout %s from reward %s", claimableAmount.String(), bigClaimedAmount.String(), stakingReward.String())
	// err = transferHelper(ctx, adminWalletAddress, defaultWalletAddress, claimableAmount, BUSY_COIN_SYMBOL, bigZero)
	// if err != nil {
	// 	response.Message = fmt.Sprintf("Error while transfer from admin to default wallet: %s", err.Error())
	// 	logger.Error(response.Message)
	// 	return response
	// }
	claimableAmounAfterDeductingFee := new(big.Int).Set(claimableAmount).Sub(claimableAmount, bigFee)
	logger.Infof("claimable amout after deducting fee %s is %s", bigFee.String(), claimableAmounAfterDeductingFee.String())
	err = addUTXO(ctx, defaultWalletAddress, claimableAmounAfterDeductingFee, BUSY_COIN_SYMBOL)
	if err != nil {
		response.Message = fmt.Sprintf("Error while adding reward utxo: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	bigClaimedAmount = bigClaimedAmount.Add(bigClaimedAmount, claimableAmount)
	stakingInfo.Claimed = bigClaimedAmount.String()
	stakingInfo.Amount = currentPhaseConfig.CurrentStakingLimit
	stakingInfoAsBytes, _ = json.Marshal(stakingInfo)
	err = ctx.GetStub().PutState(fmt.Sprintf("info~%s", stakingAddr), stakingInfoAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating staking info: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	logger.Infof("staking reward before returning response ", stakingReward.String())
	stakingInfo.TotalReward = stakingReward.String()
	stakingInfo.Claimed = claimableAmount.String()

	bigCurrentStakingAmount, _ := new(big.Int).SetString(stakingInfo.Amount, 10)
	bigCurrentStakingLimit, _ := new(big.Int).SetString(currentPhaseConfig.CurrentStakingLimit, 10)
	amounOtherThenStakingLimit := bigCurrentStakingAmount.Sub(bigCurrentStakingAmount, bigCurrentStakingLimit)
	logger.Infof("amounOtherThenStakingLimit: %s", amounOtherThenStakingLimit.String())
	err = transferHelper(ctx, stakingAddr, defaultWalletAddress, amounOtherThenStakingLimit, BUSY_COIN_SYMBOL, bigZero)
	if err != nil {
		response.Message = fmt.Sprintf("Error while transfer from staking address to default wallet: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	err = updateTotalSupply(ctx, BUSY_COIN_SYMBOL, claimableAmounAfterDeductingFee.Mul(claimableAmounAfterDeductingFee, minusOne))
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating total supply: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	// err = burnTxFee(ctx, defaultWalletAddress, BUSY_COIN_SYMBOL)
	// if err != nil {
	// 	response.Message = fmt.Sprintf("Error while burning tx fee: %s", err.Error())
	// 	logger.Error(response.Message)
	// 	return response
	// }

	response.Message = "successfully claimed"
	response.Success = true
	response.Data = stakingInfo
	logger.Info(response.Message)
	return response
}

func (bt *Busy) Unstake(ctx contractapi.TransactionContextInterface, stakingAddr string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	commonName, _ := getCommonName(ctx)
	fee, _ := getCurrentTxFee(ctx)
	bigFee, _ := new(big.Int).SetString(fee, 10)
	defaultWalletAddress, err := getDefaultWalletAddress(ctx, commonName)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting default wallet address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	balance, _ := getBalanceHelper(ctx, defaultWalletAddress, BUSY_COIN_SYMBOL)
	if bigFee.Cmp(balance) == 1 {
		response.Message = "Not enough balance for tx fee"
		logger.Error(response.Message)
		return response
	}
	stakingAddrAsBytes, err := ctx.GetStub().GetState(stakingAddr)
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching staking address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if stakingAddrAsBytes == nil {
		response.Message = fmt.Sprintf("Staking address %s not found", stakingAddr)
		logger.Error(response.Message)
		return response
	}
	var stAddr Wallet
	json.Unmarshal(stakingAddrAsBytes, &stAddr)
	if stAddr.UserID != commonName {
		response.Message = "you're not owner of staking address"
		logger.Error(response.Message)
		return response
	}

	stakingReward, err := countStakingReward(ctx, stakingAddr)
	if err != nil {
		response.Message = fmt.Sprintf("Error while couting staking reward: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	stakingInfoAsBytes, err := ctx.GetStub().GetState(fmt.Sprintf("info~%s", stakingAddr))
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching staking info: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	var stakingInfo StakingInfo
	_ = json.Unmarshal(stakingInfoAsBytes, &stakingInfo)

	currentPhaseConfig, err := getPhaseConfig(ctx)
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting phase config: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	// bigCurrentStakingLimit, _ := new(big.Int).SetString(phaseConfig.CurrentStakingLimit, 10)

	// adminWalletAddress, _ := getDefaultWalletAddress(ctx, ADMIN_USER_ID)
	bigClaimedAmount, _ := new(big.Int).SetString(stakingInfo.Claimed, 10)
	logger.Infof("Amount %s already claimed by %s", bigClaimedAmount.String(), stakingAddr)
	claimableAmount := new(big.Int).Set(stakingReward).Sub(stakingReward, bigClaimedAmount)
	logger.Infof("claimable amount after dedcuting claimed amount %s from total reward %s is %s", bigClaimedAmount.String(), stakingReward.String(), claimableAmount.String())
	// claimableAmount = claimableAmount.Add(claimableAmount, bigCurrentStakingLimit)
	bigStakingAmount, _ := new(big.Int).SetString(stakingInfo.Amount, 10)
	logger.Infof("staking amount for staking address %s is %s it is fetched from staking info", stakingAddr, bigStakingAmount.String())
	fmt.Println(bigZero)
	err = transferHelper(ctx, stakingAddr, defaultWalletAddress, bigStakingAmount, BUSY_COIN_SYMBOL, bigZero)
	if err != nil {
		response.Message = fmt.Sprintf("Error while transfer from staking address to default wallet: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	// err = transferHelper(ctx, adminWalletAddress, defaultWalletAddress, claimableAmount, BUSY_COIN_SYMBOL, bigZero)
	// if err != nil {
	// 	response.Message = fmt.Sprintf("Error while transfer from admin to default wallet: %s", err.Error())
	// 	logger.Error(response.Message)
	// 	return response
	// }
	claimableAmounAfterDeductingFee := new(big.Int).Set(claimableAmount).Sub(claimableAmount, bigFee)
	err = addUTXO(ctx, defaultWalletAddress, claimableAmounAfterDeductingFee, BUSY_COIN_SYMBOL)
	if err != nil {
		response.Message = fmt.Sprintf("Error while adding reward utxo: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	bigClaimedAmount = bigClaimedAmount.Add(bigClaimedAmount, claimableAmount)
	stakingInfo.Claimed = bigClaimedAmount.String()
	stakingInfo.Amount = currentPhaseConfig.CurrentStakingLimit
	stakingInfoAsBytes, _ = json.Marshal(stakingInfo)
	err = ctx.GetStub().PutState(fmt.Sprintf("info~%s", stakingAddr), stakingInfoAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating staking info: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	stakingInfo.TotalReward = stakingReward.String()
	stakingInfo.Claimed = claimableAmount.String()

	err = ctx.GetStub().DelState(stakingAddr)
	if err != nil {
		response.Message = fmt.Sprintf("Error while deleting staking address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	_, err = updateTotalStakingAddress(ctx, -1)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating total staking address: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	// err = burnTxFee(ctx, defaultWalletAddress, BUSY_COIN_SYMBOL)
	// if err != nil {
	// 	response.Message = fmt.Sprintf("Error while burning tx fee: %s", err.Error())
	// 	logger.Error(response.Message)
	// 	return response
	// }
	err = updateTotalSupply(ctx, BUSY_COIN_SYMBOL, claimableAmounAfterDeductingFee.Mul(claimableAmounAfterDeductingFee, minusOne))
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating total supply: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Message = "successfully unstaked"
	response.Success = true
	response.Data = stakingInfo
	logger.Info(response.Message)
	return response
}
