package main

import (
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// BusyVoting contract
type BusyVoting struct {
	contractapi.Contract
}

func (bv *BusyVoting) CreatePool(ctx contractapi.TransactionContextInterface, walletid string, votingInfo string, token string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	votingConfigBytes, err := ctx.GetStub().GetState("VotingConfig")
	votingConfig := VotingConfig{}
	if err = json.Unmarshal(votingConfigBytes, &votingConfig); err != nil {
		response.Message = fmt.Sprintf("Error while unmarshalling the voting config state: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	logger.Info("Received a Create Pool Transaction with ", votingInfo)

	//  Checking if pool Already Exists
	poolAsBytes, err := ctx.GetStub().GetState("PoolData")
	if poolAsBytes != nil {
		response.Message = fmt.Sprintf("A voting pool Already Exists")
		logger.Info(response.Message)
		return response
	}

	commonName, _ := getCommonName(ctx)
	defaultAddress, err := getDefaultWalletAddress(ctx, commonName)
	if err != nil {
		response.Message = fmt.Sprintf("Error getting the default address for %s", commonName)
		logger.Error(response.Message)
		return response
	}

	if walletid != defaultAddress {
		response.Message = fmt.Sprintf("Walletid in the request does not match with default wallet id for %s", commonName)
		logger.Error(response.Message)
		return response
	}
	balance, _ := getBalanceHelper(ctx, defaultAddress, "busy")

	minimumCoins, _ := new(big.Int).SetString(votingConfig.MinimumCoins, 10)
	if balance.Cmp(minimumCoins) == -1 {
		response.Message = fmt.Sprintf("User: %s does not have minimum 10 mil coins to create pool", commonName)
		logger.Error(response.Message)
		return response
	}

	err = burnCoins(ctx, defaultAddress, votingConfig.PoolFee, token)

	if err != nil {
		response.Message = fmt.Sprintf("Error while burning tokens at pool creation %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	poolData := Pool{
		DocType:          "pool",
		CreatedBy:        commonName,
		PoolID:           response.TxID,
		CreatedAt:        time.Now(),
		VotingStartAt:    time.Now().Add(votingConfig.VotingStartTime),
		VotingEndAt:      time.Now().Add(votingConfig.VotingPeriod),
		VotingAddressYes: "Yes-" + response.TxID,
		VotingAddressNo:  "No-" + response.TxID,
		VotingPowerYes:   bigZero.String(),
		VotingPowerNo:    bigZero.String(),
		TokenType:        token,
		VotingInfo:       votingInfo,
	}
	poolAddrAsBytes, _ := json.Marshal(poolData)

	// storing the data at PoolData
	err = ctx.GetStub().PutState("PoolData", poolAddrAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	response.Success = true
	response.Data = poolData
	response.Message = "Pool Created Successfully"
	return response
}

func (bv *BusyVoting) CreateVote(ctx contractapi.TransactionContextInterface, walletid string, votingaddress string, amount string, voteType string, token string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	//  Checking if pool Already Exists
	poolAsBytes, err := ctx.GetStub().GetState("PoolData")
	if poolAsBytes == nil || err != nil {
		response.Message = fmt.Sprintf("Voting pool does not exist")
		logger.Info(response.Message)
		return response
	}
	PoolData := Pool{}

	if err = json.Unmarshal(poolAsBytes, &PoolData); err != nil {
		response.Message = fmt.Sprintf("Error while unmarshalling the user state: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	if voteType != "Yes" && voteType != "No" {
		response.Message = fmt.Sprintf("Invalid VoteType provided")
		logger.Error(response.Message)
		return response
	}

	if PoolData.VotingAddressYes != fmt.Sprintf("Yes-%s", votingaddress) && PoolData.VotingAddressNo != fmt.Sprintf("No-%s", votingaddress) {
		response.Message = fmt.Sprintf("Voting Address doesnot exists")
		logger.Error(response.Message)
		return response
	}

	// checking if voting has started
	if time.Now().Sub(PoolData.VotingStartAt) < 0 {
		response.Message = fmt.Sprintf("Voting will start at %s", PoolData.VotingStartAt)
		logger.Error(response.Message)
		return response
	}

	// checking if voting has ended
	if time.Now().Sub(PoolData.VotingEndAt) > 0 {
		response.Message = fmt.Sprintf("Voting has ended at %s", PoolData.VotingEndAt)
		logger.Error(response.Message)
		return response
	}

	commonName, _ := getCommonName(ctx)
	defaultAddress, err := getDefaultWalletAddress(ctx, commonName)
	if err != nil {
		response.Message = fmt.Sprintf("Error getting the default address for %s", commonName)
		logger.Error(response.Message)
		return response
	}
	if walletid != defaultAddress {
		response.Message = fmt.Sprintf("Walletid in the request does not match with default wallet id for %s", commonName)
		logger.Error(response.Message)
		return response
	}

	balance, _ := getBalanceHelper(ctx, defaultAddress, "busy")

	amountInt, isConverted := new(big.Int).SetString(amount, 10)

	if !isConverted {
		response.Message = fmt.Sprint("Invalid Amount provided in the request")
		logger.Error(response.Message)
		return response
	}

	if amountInt.Cmp(bigZero) <= 0 {
		response.Message = fmt.Sprint("Amount to vote cannot be zero or negative")
		logger.Error(response.Message)
		return response
	}

	if balance.Cmp(amountInt) == -1 {
		response.Message = fmt.Sprintf("User: %s does not have enough coins to vote", commonName)
		logger.Error(response.Message)
		return response
	}
	err = burnCoins(ctx, defaultAddress, amount, token)

	if err != nil {
		response.Message = fmt.Sprintf("Error while burning tokens at vote %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	if voteType == "Yes" {
		votingPowerYay, _ := new(big.Int).SetString(PoolData.VotingPowerYes, 10)
		votingPowerYay = new(big.Int).Add(amountInt, votingPowerYay)
		PoolData.VotingPowerYes = votingPowerYay.String()
	} else {
		VotingPowerNay, _ := new(big.Int).SetString(PoolData.VotingPowerNo, 10)
		VotingPowerNay = new(big.Int).Add(amountInt, VotingPowerNay)
		PoolData.VotingPowerNo = VotingPowerNay.String()
	}
	PoolDataBytes, _ := json.Marshal(PoolData)
	vote := Vote{
		DocType:     "Vote",
		VoteTime:    time.Now(),
		VoteAddress: votingaddress,
		Tokens:      amount,
		VoteType:    voteType,
	}

	VoteListAsBytes, _ := ctx.GetStub().GetState(votingaddress)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	voteList := []Vote{}

	_ = json.Unmarshal(VoteListAsBytes, &voteList)
	voteList = append(voteList, vote)

	VoteListAsBytes, _ = json.Marshal(voteList)
	// storing the data of votelist at the vote Address
	err = ctx.GetStub().PutState(votingaddress, VoteListAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	if err = ctx.GetStub().PutState("PoolData", PoolDataBytes); err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	response.Success = true
	response.Message = "Voted successfully"
	return response
}

func (bv *BusyVoting) DestroyPool(ctx contractapi.TransactionContextInterface) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}
	commonName, _ := getCommonName(ctx)
	if commonName != "ordererAdmin" {
		response.Message = "You are not allowed to Delete Voting pool"
		logger.Error(response.Message)
		return response
	}

	//  Checking if pool doesnot Exists
	poolAsBytes, err := ctx.GetStub().GetState("PoolData")

	if poolAsBytes == nil || err != nil {
		response.Message = fmt.Sprintf("Voting pool does not exist")
		logger.Info(response.Message)
		return response
	}
	PoolData := Pool{}

	if err := json.Unmarshal(poolAsBytes, &PoolData); err != nil {
		response.Message = fmt.Sprintf("Error while unmarshalling the user state: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	// checking if voting has started
	if time.Now().Sub(PoolData.VotingEndAt) < 0 {
		response.Message = fmt.Sprintf("Voting will end at %s", PoolData.VotingEndAt)
		logger.Error(response.Message)
		return response
	}

	poolDataListAsBytes, err := ctx.GetStub().GetState("PoolDataList")
	if err != nil {
		response.Message = fmt.Sprintf("Error while retrieving the pool List: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	poolDataList := []Pool{}
	_ = json.Unmarshal(poolDataListAsBytes, &poolDataList)
	// appending the current pool data
	poolDataList = append(poolDataList, PoolData)
	poolAddrListAsBytes, _ := json.Marshal(poolDataList)
	// storing the data at PoolDataList
	err = ctx.GetStub().PutState("PoolDataList", poolAddrListAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	if err := ctx.GetStub().DelState("PoolData"); err != nil {
		response.Message = fmt.Sprintf("Error deleting the voting pool")
		logger.Error(response.Message)
		return response
	}
	response.Success = true
	response.Message = "Pool Destroyed Successfully"
	return response
}

func (bv *BusyVoting) QueryPool(ctx contractapi.TransactionContextInterface) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}
	commonName, _ := getCommonName(ctx)
	if commonName != "ordererAdmin" {
		response.Message = "You are not allowed to Delete Voting pool"
		logger.Error(response.Message)
		return response
	}

	//  Checking if pool Already Exists
	poolAsBytes, err := ctx.GetStub().GetState("PoolData")
	if poolAsBytes == nil || err != nil {
		response.Message = fmt.Sprintf("Voting pool does not exist")
		logger.Info(response.Message)
		return response
	}
	PoolData := Pool{}

	if err := json.Unmarshal(poolAsBytes, &PoolData); err != nil {
		response.Message = fmt.Sprintf("Error while unmarshalling the user state: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	response.Data = PoolData
	response.Success = true
	response.Message = "Pool Data fetched successfully"
	return response
}

// burnCoins is to burn some coins from user and reduce total supply accordingly for voting functionity
func burnCoins(ctx contractapi.TransactionContextInterface, address string, coins string, token string) error {
	minusOne, _ := new(big.Int).SetString("-1", 10)
	bigTxFee, _ := new(big.Int).SetString(coins, 10)
	err := updateTotalSupply(ctx, token, bigTxFee)
	if err != nil {
		return err
	}
	// err = addUTXO(ctx, address, bigTxFee, token)
	// if err != nil {
	// 	return err
	// }
	utxo := UTXO{
		DocType: "utxo",
		Address: address,
		Amount:  bigTxFee.Mul(bigTxFee, minusOne).String(),
		Token:   "busy",
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	err = ctx.GetStub().PutState(fmt.Sprintf("voting~%s~%s~%s", ctx.GetStub().GetTxID(), address, "busy"), utxoAsBytes)
	if err != nil {
		return err
	}
	return nil
}

// Pool History to retrieve the List of pools created till date
func (bv *BusyVoting) PoolHistory(ctx contractapi.TransactionContextInterface) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	poolDataListAsBytes, err := ctx.GetStub().GetState("PoolDataList")
	if err != nil {
		response.Message = fmt.Sprintf("Error while retrieving the pool List: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	poolDataList := []Pool{}
	_ = json.Unmarshal(poolDataListAsBytes, &poolDataList)

	response.Success = true
	response.Data = poolDataList
	response.Message = "Pool History Fetched successfully"
	return response
}
