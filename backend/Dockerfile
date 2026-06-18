FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

# Build TypeScript
RUN npm run build

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]