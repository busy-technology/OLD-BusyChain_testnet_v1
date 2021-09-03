package main

import (
	"math/big"
	"os"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

var bigZero *big.Int = new(big.Int).SetUint64(0)

func main() {
	busy := new(Busy)
	busy.UnknownTransaction = UnknownTransactionHandler
	busy.Name = "Busy"

	busyMessenger := new(BusyMessenger)
	busyMessenger.UnknownTransaction = UnknownTransactionHandler
	busyMessenger.Name = "BusyMessenger"

	cc, err := contractapi.NewChaincode(busy, busyMessenger)
	cc.DefaultContract = busy.GetName()

	if err != nil {
		panic(err.Error())
	}

	if os.Getenv("ISEXTERNAL") == "true" {
		server := &shim.ChaincodeServer{
			CCID:    os.Getenv("CHAINCODE_CCID"),
			Address: os.Getenv("CHAINCODE_ADDRESS"),
			CC:      cc,
			TLSProps: shim.TLSProperties{
				Disabled: true,
			},
		}

		if err := server.Start(); err != nil {
			panic(err.Error())
		}
	} else {
		if err := cc.Start(); err != nil {
			panic(err.Error())
		}
	}
}
