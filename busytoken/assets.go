package main

// User user on busy blockchain
type User struct {
	DocType string `json:"docType"`
	UserID  string `json:"userId"`
}

// UTXO unspent transaction output
type UTXO struct {
	Address string  `json:"address"`
	Amount  float64 `json:"amount"`
	Token   string  `json:"token"`
}

// Response response will be returned in this format
type Response struct {
	TxID    string      `json:"txId"`
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}
