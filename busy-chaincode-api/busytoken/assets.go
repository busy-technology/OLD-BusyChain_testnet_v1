package main

import "math/big"

// User user on busy blockchain
type User struct {
	DocType       string `json:"docType"`
	UserID        string `json:"userId"`
	DefaultWallet string `json:"defaultWallet"`
}

type Wallet struct {
	DocType string   `json:"docType"`
	UserID  string   `json:"userId"`
	Address string   `json:"address"`
	Balance *big.Int `json:"balance"`
}

// UTXO unspent transaction output
type UTXO struct {
	DocType string   `json:"docType"`
	Address string   `json:"address"`
	Amount  *big.Int `json:"amount"`
	Token   string   `json:"token"`
}

type Token struct {
	DocType     string   `json:"docType"`
	ID          uint64   `json:"id"`
	TokenName   string   `json:"tokenName"`
	TokenSymbol string   `json:"tokenSymbol"`
	Admin       string   `json:"admin"`
	TotalSupply *big.Int `json:"totalSupply"`
}

// Response response will be returned in this format
type Response struct {
	TxID    string      `json:"txId"`
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}
