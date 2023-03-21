FROM golang:latest as builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN make build

FROM debian:stable-slim as production

WORKDIR /app

COPY --from=builder /app/bin/app .

EXPOSE 4000

CMD [ "./app" ]
