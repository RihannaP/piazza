# Piazza REST API

This project is a REST API for a simplified Piazza-style discussion system.
Users can register, log in, create posts, browse posts by topic, and interact
with posts using likes, dislikes, and comments.

Posts expire after a set time and become read-only.

---

## Technologies
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT (Authentication)
- bcrypt
- Postman (Testing)

---

## Features
- User registration and login
- JWT-protected routes
- Create and browse posts by topic
- Like, dislike, and comment on posts
- Post expiration rules
- Owner cannot like or dislike own post
- Interaction summaries (totals and grouped by user)
- Most active post per topic
- Expired posts history

---
## Run the Project

Create a `.env` file:

Install and start:
```bash
npm install
npm start
```

Server runs at:
```bash
http://localhost:3000
```

## Main Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /posts
- GET /posts?topic=Tech
- POST /posts/:id/like
- POST /posts/:id/dislike
- POST /posts/:id/comment
- GET /posts/active/most-interesting?topic=Tech
- GET /posts/expired?topic=Tech

