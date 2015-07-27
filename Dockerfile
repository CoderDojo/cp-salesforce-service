FROM mhart/alpine-node:0.10
MAINTAINER nearForm <info@nearform.com>

RUN apk-install git make gcc g++ python
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install && rm -rf /root/.npm
COPY . /usr/src/app

VOLUME ["/usr/src/app/public"]
