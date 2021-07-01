# imports  
. ./envVar.sh
. ./scripts/utils.sh

CHANNEL_NAME="$1"
: ${CHANNEL_NAME:="busychannel"}


createChannel() {
	export FABRIC_CFG_PATH=/etc/hyperledger/fabric
	setGlobals 1
	# Poll in case the raft leader is not set yet
		set -x
		peer channel create -o localhost:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer1.busy.technology -f ./channel-artifacts/${CHANNEL_NAME}.tx --outputBlock $BLOCKFILE --tls --cafile $ORDERER_CA 
		res=$?
		
}

BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"

## Create channel
infoln "Creating channel ${CHANNEL_NAME}"
createChannel
successln "Channel '$CHANNEL_NAME' created"
