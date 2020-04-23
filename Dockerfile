
FROM node:alpine
WORKDIR /app
COPY ./package.json ./
RUN npm install typescript -g
RUN npm install --production
COPY . .
CMD ["npm","run", "start:prod"]
