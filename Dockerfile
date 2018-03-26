FROM node:9.9.0-alpine

RUN apk add --no-cache git
RUN apk add --update --no-cache python

WORKDIR /usr/app

COPY package.json .
RUN npm install --quiet

COPY . .
