FROM golang:1.13.8-alpine AS build
COPY ./ /go/src/github.com/busytoken
WORKDIR /go/src/github.com/busytoken
RUN go build -o chaincode -v .

FROM alpine:3.11 as prod
COPY --from=build /go/src/github.com/busytoken/chaincode /app/chaincode
ENV ISEXTERNAL=true
USER 1000
WORKDIR /app
CMD ./chaincode
