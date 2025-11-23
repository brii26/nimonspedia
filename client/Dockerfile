FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build && \
    echo "Build completed successfully" && \
    ls -la dist/

FROM alpine:latest

WORKDIR /output

COPY --from=builder /app/dist ./dist

CMD ["sh", "-c", "cp -rv /output/dist/* /public/ && echo 'Files copied to /public/' && ls -la /public/ && tail -f /dev/null"]
