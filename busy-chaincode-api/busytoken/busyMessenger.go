package main

import (
	"encoding/json"
	"fmt"
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

// CreateUser creates new user on busy blockchain
func (bm *BusyMessenger) SendMessage(ctx contractapi.TransactionContextInterface, recipient string, token string) Response {
	response := Response{
		TxID:    ctx.GetStub().GetTxID(),
		Success: false,
		Message: "",
		Data:    nil,
	}

	sender, _ := getCommonName(ctx)

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
	logger.Info(lastMessage)
	err = ctx.GetStub().PutState(getLastMessageKey(sender), lastMessageAsBytes)
	if err != nil {
		response.Message = fmt.Sprintf("Error while updating state in blockchain: %s", err.Error())
		logger.Error(response.Message)
		return response
	}
	busyToken := new(Busy)
	resp := busyToken.Transfer(ctx, recipient, config.BusyCoins, token)
	response.Message = "Message Processed Successfully"
	return resp
}
