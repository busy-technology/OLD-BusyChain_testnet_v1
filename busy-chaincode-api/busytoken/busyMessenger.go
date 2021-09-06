package main

import (
	"encoding/json"
	"fmt"
	"math/big"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type LastMessage struct {
	MessageTime time.Time
	Sender      string
	Recipient   string
}

// BusyMessenger contract
type BusyMessenger struct {
	contractapi.Contract
}

// MessageInfo
type MessageStore struct {
	Sender    map[string]int
	Recipient map[string]int
}

// CreateUser creates new user on busy blockchain
func (bm *BusyMessenger) SendMessage(ctx contractapi.TransactionContextInterface, recipient string, token string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	sender, _ := getCommonName(ctx)
	logger.Info("Recieved a message from", sender, "to", recipient)

	// getting the default config for messaging functionality
	configAsBytes, err := ctx.GetStub().GetState("MessageConfig")
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting confing state: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	var config MessageConfig
	if err = json.Unmarshal(configAsBytes, &config); err != nil {
		response.Message = fmt.Sprintf("Error while unmarshalling the confing state: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	// getting the last Message(time, sender and reciever) State for a single user
	lastMessageAsBytes, err := ctx.GetStub().GetState(getLastMessageKey(sender))
	if err != nil {
		response.Message = fmt.Sprintf("Error while getting last Message state: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	if lastMessageAsBytes != nil {
		var lastMessage LastMessage
		_ = json.Unmarshal(lastMessageAsBytes, &lastMessage)
		if time.Now().Sub(lastMessage.MessageTime) < config.MessageInterval {
			response.Message = fmt.Sprintf("Please wait for 5 seconds before sending the next message")
			logger.Error(response.Message)
			return response
		}
	}
	//updating the last Message
	lastMessage := LastMessage{
		MessageTime: time.Now(),
		Sender:      sender,
		Recipient:   recipient,
	}
	lastMessageAsBytes, _ = json.Marshal(lastMessage)
	err = ctx.GetStub().PutState(getLastMessageKey(sender), lastMessageAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	senderAsBytes, err := ctx.GetStub().GetState(sender)
	if senderAsBytes == nil {
		response.Message = fmt.Sprintf("Sender with common name %s does not exists", sender)
		logger.Info(response.Message)
		return response
	}
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user from blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	senderDetails := User{}
	if err := json.Unmarshal(senderAsBytes, &senderDetails); err != nil {
		response.Message = fmt.Sprintf("Error while retrieving the sender details %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	recipientAsBytes, err := ctx.GetStub().GetState(recipient)
	if recipientAsBytes == nil {
		response.Message = fmt.Sprintf("Recipient with common name %s does not exists", recipient)
		logger.Info(response.Message)
		return response
	}
	if err != nil {
		response.Message = fmt.Sprintf("Error while fetching user from blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	recipientDetails := User{}
	if err := json.Unmarshal(recipientAsBytes, &recipientDetails); err != nil {
		response.Message = fmt.Sprintf("Error while retrieving the recipient details %s", err.Error())
		logger.Error(response.Message)
		return response
	}

	val, ok := senderDetails.MessageCoins[recipientDetails.DefaultWallet]

	var messagestore MessageStore
	busyCoin, _ := strconv.Atoi(config.BusyCoins)
	// using MessageStore
	if ok && val > 0 {
		logger.Info("Using the message store")
		if err := AddCoins(ctx, recipientDetails.DefaultWallet, config.BusyCoins, token); err != nil {
			response.Message = fmt.Sprintf("Error while Adding coins to the recipient default wallet %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		senderDetails.MessageCoins[recipientDetails.DefaultWallet] = val - busyCoin
		senderDetails.MessageCoins["totalCoins"] -= busyCoin
		senderAsBytes, err = json.Marshal(senderDetails)
		if err != nil {
			response.Message = fmt.Sprintf("Error while Marshalling the senderdetails %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		err = ctx.GetStub().PutState(sender, senderAsBytes)
		if err != nil {
			response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		messagestore.Sender = senderDetails.MessageCoins
		messagestore.Recipient = recipientDetails.MessageCoins
	} else {
		logger.Info("using default wallet")

		balance, _ := getBalanceHelper(ctx, senderDetails.DefaultWallet, token)
		amountInt, _ := new(big.Int).SetString(config.BusyCoins, 10)
		if balance.Cmp(amountInt) == -1 {
			response.Message = fmt.Sprintf("User: %s does not have enough coins to Send Message", sender)
			logger.Error(response.Message)
			return response
		}

		if err := RemoveCoins(ctx, senderDetails.DefaultWallet, config.BusyCoins, token); err != nil {
			response.Message = fmt.Sprintf("Error while Adding coins to the recipient default wallet %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		if val, ok := recipientDetails.MessageCoins[senderDetails.DefaultWallet]; ok {
			recipientDetails.MessageCoins[senderDetails.DefaultWallet] = val + busyCoin
		} else {
			recipientDetails.MessageCoins[senderDetails.DefaultWallet] = busyCoin
		}
		recipientDetails.MessageCoins["totalCoins"] += busyCoin

		recipientAsBytes, err = json.Marshal(recipientDetails)
		if err != nil {
			response.Message = fmt.Sprintf("Error while Marshalling the recipientDetails %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		err = ctx.GetStub().PutState(recipient, recipientAsBytes)
		if err != nil {
			response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
			logger.Error(response.Message)
			return response
		}
		messagestore.Sender = senderDetails.MessageCoins
		messagestore.Recipient = recipientDetails.MessageCoins
	}
	response.Data = messagestore
	response.Message = "Message Processed Successfully"
	response.Success = true
	return response
}

// RemoveCoins is to move coins from default wallet to message store
func RemoveCoins(ctx contractapi.TransactionContextInterface, address string, coins string, token string) error {
	minusOne, _ := new(big.Int).SetString("-1", 10)
	bigTxFee, _ := new(big.Int).SetString(coins, 10)

	utxo := UTXO{
		DocType: "utxo",
		Address: address,
		Amount:  bigTxFee.Mul(bigTxFee, minusOne).String(),
		Token:   "busy",
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	err := ctx.GetStub().PutState(fmt.Sprintf("message~%s~%s~%s", ctx.GetStub().GetTxID(), address, "busy"), utxoAsBytes)
	if err != nil {
		return err
	}
	return nil
}

// RemoveCoins is to move coins from default wallet to message store
func AddCoins(ctx contractapi.TransactionContextInterface, address string, coins string, token string) error {
	plusOne, _ := new(big.Int).SetString("1", 10)
	bigTxFee, _ := new(big.Int).SetString(coins, 10)

	utxo := UTXO{
		DocType: "utxo",
		Address: address,
		Amount:  bigTxFee.Mul(bigTxFee, plusOne).String(),
		Token:   "busy",
	}
	utxoAsBytes, _ := json.Marshal(utxo)
	err := ctx.GetStub().PutState(fmt.Sprintf("message~%s~%s~%s", ctx.GetStub().GetTxID(), address, "busy"), utxoAsBytes)
	if err != nil {
		return err
	}
	return nil
}
