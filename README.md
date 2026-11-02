# FocusEngine backend

Node + Express + MongoDB (Mongoose) + JWT + Socket.IO + Multer.

## Run it
1. Install Node 18+ and MongoDB (local, or a free Atlas cluster).
2. `cp .env.example .env` and set `JWT_SECRET` (any long random string) and `MONGODB_URI`.
3. `npm install` then `npm run dev` (API on http://localhost:5000).
4. Check: open http://localhost:5000/api/health

## How a request flows
React -> `fetch('/api/tasks', { Authorization: Bearer <jwt> })` -> `middleware/auth.js` verifies the token and sets `req.user.id`
-> route handler queries MongoDB **always filtered by `user: req.user.id`** -> JSON back -> React updates.
That one filter is what the project calls "isolated, per-user data access".

## Endpoints (all except register/login need the Bearer token)
| Method | Path | What it does |
|---|---|---|
| POST | /api/auth/register | `{name,email,password}` -> `{token,user}` (password hashed with bcrypt) |
| POST | /api/auth/login | `{email,password}` -> `{token,user}` |
| GET / PATCH | /api/auth/me | read / edit `name`, `bio`, `avatar` |
| GET | /api/tasks | filters: `?status=active\|completed&area=&q=&due=YYYY-MM-DD` |
| POST | /api/tasks | `{title, area, priority: low\|medium\|high, dueDate, estimateHours}` |
| PATCH | /api/tasks/:id | edit fields or `{completed:true}` (sets `completedAt`) |
| DELETE | /api/tasks/:id | delete |
| POST | /api/focus | `{minutes, taskId?, taskTitle?}` when a timer finishes |
| GET | /api/focus | recent sessions |
| GET | /api/analytics/overview?days=7 | everything the 6 analytics tabs need |
| GET | /api/chat/:room/messages | history. Rooms: `general` or `dm:<idA>:<idB>` |
| POST | /api/upload | multipart field `image` (png/jpg/webp/gif, 2 MB) -> `{url}` |

## Socket.IO (live chat)
```js
const socket = io('http://localhost:5000', { auth: { token } });
socket.emit('room:join', 'general', (r) => console.log(r));
socket.emit('message:send', { room: 'general', text: 'hi' });
socket.on('message:new', (msg) => { /* append to the chat list */ });
```

## Connecting the frontend you already have
The HTML mockups use short field names. Map them like this:
| UI field | API field |
|---|---|
| `t` / title | `title` |
| `pri` (high/medium/low or 3/2/1) | `priority` |
| `due` | `dueDate` |
| `est` | `estimateHours` |
| `done` / `doneAt` | `completed` / `completedAt` |
| `area` | `area` |

- Replace each in-memory action (`tog`, `del`, add form) with a `fetch` to the matching endpoint.
- When the focus timer ends, `POST /api/focus` instead of `S.ses.push(...)`.
- Replace the analytics calculations with one `GET /api/analytics/overview`.
- Replace the fake Companion/Chat replies with the Socket.IO calls above.

## Design choices worth knowing (good interview answers)
- Passwords: bcrypt (12 rounds), never returned (`select:false`). Login gives the same error for a wrong email or password.
- JWT expires in 7 days. Login/register are rate limited. `helmet` + CORS locked to `CLIENT_URL`.
- Uploads: random filenames, type checked by MIME, 2 MB limit.
- Dates are `YYYY-MM-DD` strings (UTC for sessions) so the calendar matches without timezone bugs. A real app would store the user's timezone.
- Focus score = focused minutes / (days x 30 min target), capped at 100. Change it in `routes/analytics.js`.

## Not done yet
Tests, refresh tokens/logout everywhere, password reset, email verification, pagination on tasks, deployment config.
