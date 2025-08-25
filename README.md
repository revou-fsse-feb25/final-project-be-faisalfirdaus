# 🎬 Cinema Booking API

A full-featured **backend service** for a cinema ticket booking system, built with [NestJS](https://nestjs.com/), [Prisma](https://www.prisma.io/) ORM, and PostgreSQL.

---

## ✨ Features

- 🔐 **Authentication & Authorization** with JWT (access & refresh tokens, role-based guards)
- 👤 **User Management** (profile CRUD, admin-only list of all users)
- 🎥 **Movies & Genres** (list, detail, showtimes, genre linking, admin CRUD)
- 🏢 **Theaters & Studios** (list, details, seat layout, seat blocking, admin CRUD)
- 🕒 **Showtimes** (list, detail, live seat availability, admin CRUD)
- 🎟 **Bookings** (create, view, cancel, claim; user vs admin scopes)
- 💳 **Payments** (attempt, retry, list, webhook integration)
- 📜 **Swagger API Docs** at `/api/docs`
- 🗄 **PostgreSQL + Prisma** database layer
- 📦 **Modular NestJS Architecture** (controllers, services, repositories)

---

## 🛠️ Tech Stack

- [NestJS](https://nestjs.com/) – Node.js framework
- [Prisma](https://www.prisma.io/) – Type-safe ORM
- [PostgreSQL](https://www.postgresql.org/) – Database
- [JWT](https://jwt.io/) – Authentication
- [Swagger](https://swagger.io/tools/swagger-ui/) – API Documentation
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) – Password hashing

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>

cd cinema-booking-api

npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
