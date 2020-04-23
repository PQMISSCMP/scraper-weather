
FROM node:alpine

RUN apk add --update \
  git \
  openssh-client

WORKDIR /usr/app

COPY ./package.json ./

RUN npm install --production

COPY ./ ./

CMD ["npm","start"]