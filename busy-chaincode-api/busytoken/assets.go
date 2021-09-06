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
	Decimals    uint64 `json:"decimals"`
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

// Pool represents the data of overall Governance Voting
type Pool struct {
	DocType          string    `json:"docType"`
	CreatedBy        string    `json:"createdBy"`
	CreatedAt        time.Time `json:"createdAt"`
	VotingStartAt    time.Time `json:"votingStartAt"`
	VotingEndAt      time.Time `json:"votingEndAt"`
	VotingAddressYay string    `json:"votingAddressYay"`
	VotingAddressNay string    `json:"votingAddressNay"`
	VotingPowerYay   string    `json:"votingPowerYay"`
	VotingPowerNay   string    `json:"votingPowerNay"`
	TokenType        string    `json:"tokenType"`
	VotingInfo       string    `json:"votingInfo"`
}

// Vote represents the tokens given by individual vote to the pool
type Vote struct {
	DocType     string    `json:"docType"`
	VoteTime    time.Time `json:"voteTime"`
	VoteAddress string    `json:"voteAddress"`
	Tokens      string    `json:"tokens"`
	VoteType    string    `json:"votetype"`
}

// MessageConfig to set intial configuration for BusyCoins
type MessageConfig struct {
	// BusyCoins to deduct
	BusyCoins       string        `json:"busyCoins"`
	MessageInterval time.Duration `json:"messageInterval"`
}

// PhaseConfig to store phase config
type PhaseConfig struct {
	CurrentPhase          uint64 `json:"currentPhase"`
	TotalStakingAddr      string `json:"totalStakingAddr"`
	NextStakingAddrTarget string `json:"nextStakingAddrTarget"`
	CurrentStakingLimit   string `json:"CurrentStakingLimit"`
}

// VotingConfig to set Configuration for Voting
type VotingConfig struct {
	MinimumCoins    string        `json:"minimumCoins"`
	PoolFee         string        `json:"poolFee"`
	VotingPeriod    time.Duration `json:"votingPeriod"`
	VotingStartTime time.Duration `json:"votingStartTime"`
}
