FROM node:20.1.0-alpine

EXPOSE 4400

RUN mkdir -p /app/server

WORKDIR /app/server

COPY package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "run", "dev"]
