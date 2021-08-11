package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

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

func pruneUTXOs(ctx contractapi.TransactionContextInterface, sender string, token string) (float64, []string, error) {
	// Query all the records where owner is sender and
	// token is specified token
	var queryString string = fmt.Sprintf(`{
		"selector": {
		   "address": "%s",
		   "token": "%s"
		}
	}`, sender, token)
	resultIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return 0, nil, err
	}
	defer resultIterator.Close()
	var utxo UTXO
	var balance float64 = 0

	// Loop through all the fetched records and
	// Sum all of their amount delete all existing utxo records
	var utxoKeys []string
	for resultIterator.HasNext() {
		data, _ := resultIterator.Next()
		json.Unmarshal(data.Value, &utxo)
		// err := ctx.GetStub().DelState(data.Key)
		utxoKeys = append(utxoKeys, data.Key)
		if err != nil {
			return 0, nil, err
		}
		balance += utxo.Amount
	}
	return balance, utxoKeys, nil
}

func transferHelper(ctx contractapi.TransactionContextInterface, sender string, recipiant string, amount float64, token string) error {
	var txID string = ctx.GetStub().GetTxID()

	// Prune exsting utxo if sender and count his balance
	balance, utxoKeys, err := pruneUTXOs(ctx, sender, token)
	if err != nil {
		return fmt.Errorf("error while pruning UTXOs: %s", err.Error())
	}

	// Check if sender has enough balance
	if amount > balance {
		return fmt.Errorf("amount %f higher then your total balance %f", amount, balance)
	}

	// Delete existing utxos
	for _, v := range utxoKeys {
		_ = ctx.GetStub().DelState(v)
	}
	// Deduct balance of sender
	balance -= amount
	utxo := UTXO{
		DocType: "utxo",
		Address: sender,
		Amount:  balance,
		Token:   token,
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	_ = ctx.GetStub().PutState(fmt.Sprintf("%s~%s~%s", txID, sender, token), utxoAsBytes)

	// Create new utxo for recipiant
	utxo = UTXO{
		DocType: "utxo",
		Address: recipiant,
		Amount:  amount,
		Token:   token,
	}
	utxoAsBytes, _ = json.Marshal(utxo)
	err = ctx.GetStub().PutState(fmt.Sprintf("%s~%s~%s", txID, recipiant, token), utxoAsBytes)
	if err != nil {
		return fmt.Errorf("error while put state in ledger: %s", err.Error())
	}
	return nil
}

func getBalanceHelper(ctx contractapi.TransactionContextInterface, address string, token string) (float64, error) {
	walletAsBytes, err := ctx.GetStub().GetState(address)
	if err != nil {
		return 0, fmt.Errorf("error while fetching wallet: %s", err.Error())
	}
	if walletAsBytes == nil {
		return 0, fmt.Errorf("address %s not found", address)
	}
	balance, _, err := pruneUTXOs(ctx, address, token)
	if err != nil {
		return 0, fmt.Errorf("error while fetching balance: %s", err.Error())
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

func addUTXO(ctx contractapi.TransactionContextInterface, address string, amount float64, symbol string) error {
	utxo := UTXO{
		DocType: "utxo",
		Address: address,
		Amount:  amount,
		Token:   symbol,
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	err := ctx.GetStub().PutState(fmt.Sprintf("%s~%s~%s", ctx.GetStub().GetTxID(), address, symbol), utxoAsBytes)
	return err
}

// last Message key
func getLastMessageKey(userId string) string {
	return fmt.Sprintf("lastmessage%s", userId)
}
