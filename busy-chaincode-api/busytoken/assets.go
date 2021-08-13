package main

import "time"

// User user on busy blockchain
type User struct {
	DocType       string `json:"docType"`
	UserID        string `json:"userId"`
	DefaultWallet string `json:"defaultWallet"`
}

type Wallet struct {
	DocType string  `json:"docType"`
	UserID  string  `json:"userId"`
	Address string  `json:"address"`
	Balance float64 `json:"balance"`
}

// UTXO unspent transaction output
type UTXO struct {
	DocType string  `json:"docType"`
	Address string  `json:"address"`
	Amount  float64 `json:"amount"`
	Token   string  `json:"token"`
}

type Token struct {
	DocType     string  `json:"docType"`
	ID          uint64  `json:"id"`
	TokenName   string  `json:"tokenName"`
	TokenSymbol string  `json:"tokenSymbol"`
	Admin       string  `json:"admin"`
	TotalSupply float64 `json:"totalSupply"`
}

// Response response will be returned in this format
type Response struct {
	TxID    string      `json:"txId"`
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// MessageConfig to set intial configuration for BusyCoins
type MessageConfig struct {
	// BusyCoins to deduct
	BusyCoins       float64       `json:"busyCoins"`
	MessageInterval time.Duration `json:"messageInterval"`
}
