package main

import "time"

// User user on busy blockchain
type User struct {
	DocType       string `json:"docType"`
	UserID        string `json:"userId"`
	DefaultWallet string `json:"defaultWallet"`
}

type Wallet struct {
	DocType string `json:"docType"`
	UserID  string `json:"userId"`
	Address string `json:"address"`
	Balance string `json:"balance"`
}

// UTXO unspent transaction output
type UTXO struct {
	DocType string `json:"docType"`
	Address string `json:"address"`
	Amount  string `json:"amount"`
	Token   string `json:"token"`
}

type Token struct {
	DocType     string `json:"docType"`
	ID          uint64 `json:"id"`
	TokenName   string `json:"tokenName"`
	TokenSymbol string `json:"tokenSymbol"`
	Admin       string `json:"admin"`
	TotalSupply string `json:"totalSupply"`
}

// Response response will be returned in this format
type Response struct {
	TxID    string      `json:"txId"`
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// LockedTokens locked tokens
type LockedTokens struct {
	DocType        string `json:"docType"`
	TotalAmount    string `json:"totalAmount"`
	ReleasedAmount string `json:"releasedAmount"`
	StartedAt      uint64 `json:"startedAt"`
	ReleaseAt      uint64 `json:"releaseAt"`
}

// MessageConfig to set intial configuration for BusyCoins
type MessageConfig struct {
	// BusyCoins to deduct
	BusyCoins       float64       `json:"busyCoins"`
	MessageInterval time.Duration `json:"messageInterval"`
}
