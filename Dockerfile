FROM node:16-alpine

WORKDIR /usr/src/app

COPY package.json main.js ./

RUN npm install

CMD ["node", "main.js"]
