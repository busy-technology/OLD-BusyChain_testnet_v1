package main

import (
	"encoding/json"
	"fmt"
	"math/big"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

var bigOne *big.Int = new(big.Int).SetUint64(1)
var bigTwo *big.Int = new(big.Int).SetUint64(2)

// UnknownTransactionHandler returns a shim error
// with details of a bad transaction request
func UnknownTransactionHandler(ctx contractapi.TransactionContextInterface) error {
	fcn, args := ctx.GetStub().GetFunctionAndParameters()
	return fmt.Errorf("invalid function %s passed with args %v", fcn, args)
}

func getCommonName(ctx contractapi.TransactionContextInterface) (string, error) {
	x509, err := ctx.GetClientIdentity().GetX509Certificate()
	if err != nil {
		return "", err
	}
	return x509.Subject.CommonName, nil
}

func find(slice []string, val string) (int, bool) {
	for i, item := range slice {
		if item == val {
			return i, true
		}
	}
	return -1, false
}

func pruneUTXOs(ctx contractapi.TransactionContextInterface, sender string, token string) (*big.Int, []string, error) {
	// Query all the records where owner is sender and
	// token is specified token

	var utxo UTXO
	balance, _ := new(big.Int).SetString("0", 10)
	var queryString string = fmt.Sprintf(`{
		"selector": {
		   "address": "%s",
		   "token": "%s"
		}
	}`, sender, token)
	resultIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return balance, nil, err
	}
	defer resultIterator.Close()

	// Loop through all the fetched records and
	// Sum all of their amount delete all existing utxo records
	var utxoKeys []string
	for resultIterator.HasNext() {
		data, _ := resultIterator.Next()
		json.Unmarshal(data.Value, &utxo)
		// err := ctx.GetStub().DelState(data.Key)
		utxoKeys = append(utxoKeys, data.Key)
		if err != nil {
			return balance, nil, err
		}
		bigAmount, _ := new(big.Int).SetString(utxo.Amount, 10)
		balance = balance.Add(balance, bigAmount)
	}
	return balance, utxoKeys, nil
}

func transferHelper(ctx contractapi.TransactionContextInterface, sender string, recipiant string, amount *big.Int, token string, fee *big.Int) error {
	var txID string = ctx.GetStub().GetTxID()

	// Prune exsting utxo if sender and count his balance
	balance, utxoKeys, err := pruneUTXOs(ctx, sender, token)
	if err != nil {
		return fmt.Errorf("error while pruning UTXOs: %s", err.Error())
	}

	bigAmountWithTransferFee := fee.Add(fee, amount)

	// Check if sender has enough balance
	if bigAmountWithTransferFee.Cmp(balance) == 1 {
		return fmt.Errorf("amount %f higher then your total balance %f", amount, balance)
	}

	// Delete existing utxos
	for _, v := range utxoKeys {
		_ = ctx.GetStub().DelState(v)
	}
	// Deduct balance of sender
	balance = balance.Sub(balance, bigAmountWithTransferFee)
	utxo := UTXO{
		DocType: "utxo",
		Address: sender,
		Amount:  balance.String(),
		Token:   token,
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	_ = ctx.GetStub().PutState(fmt.Sprintf("%s~%s~%s", txID, sender, token), utxoAsBytes)

	// Create new utxo for recipiant
	utxo = UTXO{
		DocType: "utxo",
		Address: recipiant,
		Amount:  amount.String(),
		Token:   token,
	}
	utxoAsBytes, _ = json.Marshal(utxo)
	err = ctx.GetStub().PutState(fmt.Sprintf("%s~%s~%s", txID, recipiant, token), utxoAsBytes)
	if err != nil {
		return fmt.Errorf("error while put state in ledger: %s", err.Error())
	}
	return nil
}

func getBalanceHelper(ctx contractapi.TransactionContextInterface, address string, token string) (*big.Int, error) {
	// bigZero, _ := new(big.Int).SetString("0", 10)

	walletAsBytes, err := ctx.GetStub().GetState(address)
	if err != nil {
		return bigZero, fmt.Errorf("error while fetching wallet: %s", err.Error())
	}
	if walletAsBytes == nil {
		return bigZero, fmt.Errorf("address %s not found", address)
	}
	balance, _, err := pruneUTXOs(ctx, address, token)
	if err != nil {
		return bigZero, fmt.Errorf("error while fetching balance: %s", err.Error())
	}
	return balance, nil
}

func getDefaultWalletAddress(ctx contractapi.TransactionContextInterface, commonName string) (string, error) {
	userAsBytes, err := ctx.GetStub().GetState(commonName)
	if err != nil {
		return "", fmt.Errorf("error while fetching user details")
	}
	if userAsBytes == nil {
		return "", fmt.Errorf("user %s doesn't exists", commonName)
	}
	var user User
	_ = json.Unmarshal(userAsBytes, &user)
	return user.DefaultWallet, nil
}

func addUTXO(ctx contractapi.TransactionContextInterface, address string, amount *big.Int, symbol string) error {
	utxo := UTXO{
		DocType: "utxo",
		Address: address,
		Amount:  amount.String(),
		Token:   symbol,
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	err := ctx.GetStub().PutState(fmt.Sprintf("%s~%s~%s", ctx.GetStub().GetTxID(), address, symbol), utxoAsBytes)
	return err
}

func calculatePercentage(amount *big.Int, numerator uint64, denominator uint64) *big.Int {
	bigNumerator := new(big.Int).SetUint64(numerator)
	bigDenominator := new(big.Int).SetUint64(denominator)
	amount = amount.Mul(amount, bigNumerator)
	return amount.Div(amount, bigDenominator)
}

// last Message key
func getLastMessageKey(userId string) string {
	return fmt.Sprintf("lastmessage%s", userId)
}

// updateTotalSupply adds or remove amount from totalSupply
func updateTotalSupply(ctx contractapi.TransactionContextInterface, tokenSymbol string, amount *big.Int) error {
	var token Token
	tokenAsBytes, err := ctx.GetStub().GetState(tokenSymbol)
	if tokenAsBytes == nil {
		return fmt.Errorf("Token %s doesn't exists", tokenSymbol)
	}
	if err != nil {
		return err
	}

	_ = json.Unmarshal(tokenAsBytes, &token)
	bigTotalSupply, _ := new(big.Int).SetString(token.TotalSupply, 10)
	token.TotalSupply = bigTotalSupply.Sub(bigTotalSupply, amount).String()
	tokenAsBytes, _ = json.Marshal(token)
	err = ctx.GetStub().PutState(tokenSymbol, tokenAsBytes)
	if err != nil {
		return err
	}
	return nil
}

// burnTxFee burn tx fee from user and reduce total supply accordingly
func burnTxFee(ctx contractapi.TransactionContextInterface, address string, token string) error {
	txFee, err := getCurrentTxFee(ctx)
	if err != nil {
		return err
	}
	minusOne, _ := new(big.Int).SetString("-1", 10)
	bigTxFee, _ := new(big.Int).SetString(txFee, 10)
	err = updateTotalSupply(ctx, token, bigTxFee)
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
	err = ctx.GetStub().PutState(fmt.Sprintf("burnTxFee~%s~%s~%s", ctx.GetStub().GetTxID(), address, "busy"), utxoAsBytes)
	if err != nil {
		return err
	}
	return nil
}

// getCurrentTxFee get current tx fee from blockchain
func getCurrentTxFee(ctx contractapi.TransactionContextInterface) (string, error) {
	transferFeesAsBytes, err := ctx.GetStub().GetState("transferFees")
	if err != nil {
		return "", fmt.Errorf("error while fetching transfer fee")
	}
	if transferFeesAsBytes == nil {
		return "", fmt.Errorf("can't fetch transfer fee you might not have initialise chaincode")
	}
	return string(transferFeesAsBytes), nil
}

func updatePhase(ctx contractapi.TransactionContextInterface) (*PhaseConfig, error) {
	phaseConfigAsBytes, err := ctx.GetStub().GetState("phaseConfig")
	if err != nil {
		return nil, err
	}
	if phaseConfigAsBytes == nil {
		return nil, fmt.Errorf("initialize chaincode first")
	}

	var phaseConfig PhaseConfig
	_ = json.Unmarshal(phaseConfigAsBytes, &phaseConfig)
	bigCurrentStakingAddr, _ := new(big.Int).SetString(phaseConfig.TotalStakingAddr, 10)
	bigCurrentStakingAddr = bigCurrentStakingAddr.Add(bigCurrentStakingAddr, bigOne)
	if bigCurrentStakingAddr.String() == phaseConfig.NextStakingAddrTarget {
		phaseConfig.CurrentPhase += 1

		bigNextStakingAddrTarget, _ := new(big.Int).SetString(phaseConfig.NextStakingAddrTarget, 10)
		bigNextStakingAddrTarget = bigNextStakingAddrTarget.Mul(bigNextStakingAddrTarget, bigTwo)
		phaseConfig.NextStakingAddrTarget = bigNextStakingAddrTarget.String()

		bigCurrentStakingLimit, _ := new(big.Int).SetString(phaseConfig.CurrentStakingLimit, 10)
		bigCurrentStakingLimit = bigCurrentStakingLimit.Div(bigCurrentStakingLimit, bigTwo)
		phaseConfig.CurrentStakingLimit = bigCurrentStakingLimit.String()
	}
	phaseConfigAsBytes, _ = json.Marshal(phaseConfig)
	err = ctx.GetStub().PutState("phaseConfig", phaseConfigAsBytes)
	return &phaseConfig, err
}

func getPhaseConfig(ctx contractapi.TransactionContextInterface) (*PhaseConfig, error) {
	phaseConfigAsBytes, err := ctx.GetStub().GetState("phaseConfig")
	if err != nil {
		return nil, err
	}
	if phaseConfigAsBytes == nil {
		return nil, fmt.Errorf("initialize chaincode first")
	}
	var phaseConfig PhaseConfig
	_ = json.Unmarshal(phaseConfigAsBytes, &phaseConfig)
	return &phaseConfig, nil
}
