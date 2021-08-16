#!/bin/bash

. ./envVar.sh

peer lifecycle chaincode package busytoken.tar.gz --path ../busy-chaincode-api/busytoken --lang golang --label $1

setGlobalsForPeer0BusyOrg
peer lifecycle chaincode install busytoken.tar.gz 
export CCID=$(peer lifecycle chaincode queryinstalled | cut -d ' ' -f 3 | sed s/.$// | grep $1)
peer lifecycle chaincode approveformyorg -o localhost:7050 --package-id $CCID --channelID busychannel --name busytoken --version 1 --sequence $2 --waitForEvent --tls --cafile $ORDERER_CA --init-required

peer lifecycle chaincode commit -o localhost:7050 --channelID busychannel --name busytoken --version 1 --sequence $2 --tls true --cafile $ORDERER_CA --peerAddresses localhost:7051 --tlsRootCertFiles organizations/peerOrganizations/busy.technology/peers/peer0.busy.technology/tls/ca.crt --init-required

peer chaincode invoke -o localhost:7050 --channelID busychannel --name busytoken --tls true --cafile $ORDERER_CA --peerAddresses localhost:7051 --tlsRootCertFiles organizations/peerOrganizations/busy.technology/peers/peer0.busy.technology/tls/ca.crt --isInit -c '{"function":"Init","Args":[]}'

setGlobalsForPeer1BusyOrg
peer lifecycle chaincode install busytoken.tar.gz