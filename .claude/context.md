# Nimonspedia — Root Context

## Architecture: Tri-Service + Nginx Reverse Proxy

```
nimonspedia/
├── src/        PHP custom MVC backend (core product/order/review/cart/auth logic)
├── backend/     Node.js/Fastify backend (auctions, chat, payments, push notifications, WebSockets)
├── frontend/     React 18 + Vite + TailwindCSS SPA (admin, auction, chat, payment pages)
├── database/   PostgreSQL init SQL (init.sql creates all tables)
├── public/     PHP entry point (index.php) + React build output (copied by Docker)
├── storage/    Uploaded files (product images, review images, store logos)
├── nginx.conf  Reverse proxy config — routes /api/node/* and /socket.io/* to node-server
```

## Container Map (docker-compose.yml)
| Container          | Image/Build         | Role                          | Internal Host  |
|--------------------|---------------------|-------------------------------|----------------|
| nimonspedia-php    | ./Dockerfile        | PHP-FPM + Nginx (supervisord) | php            |
| nimonspedia-db     | postgres:16-alpine  | PostgreSQL 16                 | db             |
| nimonspedia-node   | ./backend/Dockerfile | Fastify + Socket.io           | node-server    |
| nimonspedia-redis  | redis:alpine        | Redis (sessions + cache)      | redis          |
| nimonspedia-nginx  | ./Dockerfile.nginx  | Nginx + React SPA             | nginx          |

## Request Flow
- Browser → nginx:${NGINX_PORT} (default 8080)
  - /api/node/* → node-server:3000 (Node REST)
  - /socket.io/* → node-server:3000 (WebSocket)
  - /uploads/*   → ./storage/ (static files served directly)
  - /admin|/auction|/chat|/payment/* → React SPA (index.html)
  - everything else → PHP-FPM via FastCGI (with 10m cache)

## PHP ↔ Node Internal Communication
- PHP calls Node at NODE_INTERNAL_URL (http://node-server:3000) using INTERNAL_API_KEY header
- Used for: triggering push notifications after order/review events

## Environment Variables
See .env.example for all required vars. Copy to .env before `docker compose up`.
Key vars: POSTGRES_*, REDIS_*, JWT_SECRET, VAPID_*, MIDTRANS_*, INTERNAL_API_KEY, NGINX_PORT

## Tech Stack Summary
- PHP 8.3 — custom MVC (no Laravel/Symfony), PDO/PostgreSQL, Redis sessions
- Node.js — Fastify 4, Socket.io, Bull queues, pg, JWT, bcryptjs, web-push, Midtrans client
- React 18 + TypeScript + Vite + TailwindCSS + React Router v6
- PostgreSQL 16, Redis Alpine
- Nginx — FastCGI caching, WebSocket proxy, SPA routing
- Supervisord — manages PHP-FPM + Nginx processes inside php container
