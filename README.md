# Moji

A full-stack real-time chat application with WebRTC voice/video calling, built to practice production-style patterns — Socket.IO event architecture, JWT auth with rotating refresh tokens, WebRTC signaling, and containerized local development.

## Live Demo

- **App:** https://moji-lake.vercel.app
- **API:** https://<your-render-app>.onrender.com
- **API Docs (Swagger):** https://<your-render-app>.onrender.com/swagger

> Note: the backend is hosted on a free tier and may take 30–50 seconds to wake up on the first request after a period of inactivity.

## Features

- **Authentication** — JWT access tokens (15 min) + rotating opaque refresh tokens (14 days, stored server-side per session, revocable on logout).
- **Real-time messaging** — Socket.IO powered, text and image messages, delivered instantly to every open tab/device of both participants.
- **Direct & group conversations** — 1-1 chats and multi-member group chats, both friend-gated (can only message/add people you're already friends with).
- **Friend system** — send/accept/decline friend requests.
- **Image sharing** — upload images (Cloudinary) as standalone messages or with a caption.
- **Voice & video calling** — WebRTC peer-to-peer calls (1-1) with mute, camera toggle, fullscreen/floating draggable call window, ringback/ringtone audio, and remote-camera-off detection via a dedicated signaling event (WebRTC track mute events aren't reliable for this).
- **Call history as messages** — every completed/missed/rejected/cancelled call is logged both as a `Call` document (structured history) and mirrored into the conversation as a chat message (like Messenger/Zalo), with a "call back" shortcut.
- **Presence** — online/offline status per user, broadcast in real time.
- **Read receipts & unread counts** — per-conversation, per-user.
- **Notification sounds** — distinct sounds for sending vs. receiving a message, and for ringback/ringtone during calls.
- **Avatar upload** — Cloudinary-backed, auto-cropped.

## Tech Stack

**Backend**
- Node.js + [Express 5](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) — database and ODM
- [Socket.IO](https://socket.io/) — real-time messaging and WebRTC signaling relay
- `jsonwebtoken` — access token issuance/verification
- `bcrypt` — password hashing
- [Cloudinary](https://cloudinary.com/) + `multer` — image upload/storage
- `swagger-jsdoc` + `swagger-ui-express` — API documentation

**Frontend**
- React 18 + TypeScript + Vite
- [Zustand](https://zustand-demo.pmnd.rs/) — client state (auth, chat, calls, sockets, theme)
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
- React Hook Form + Zod — form handling and schema validation
- Axios — HTTP client with automatic access-token refresh on 401/403
- `socket.io-client`
- Native WebRTC APIs (`RTCPeerConnection`, `getUserMedia`) — no external calling SDK
- Sonner — toast notifications
- `emoji-mart` — emoji picker

**Infrastructure**
- Docker & Docker Compose (local development)
- MongoDB Atlas (cloud-hosted database)
- Render (backend) / Vercel (frontend)

## Architecture

```
Client  <--REST-->  Route → Middleware → Controller → Model
Client  <--WS--->   Socket.IO connection → Handler → Model
```

- **Route** — endpoint definitions, wires middleware + controller
- **Middleware** — auth (`protectedRoute`, `socketAuthMiddleware`), friendship/group-membership checks, file upload (`multer`)
- **Controller** — request parsing, business logic, response shaping
- **Model** — Mongoose schemas
- **Socket handlers** — real-time events live outside the REST layer (`socket/index.js` for presence/messaging wiring, `handlers/callHandler.js` for the full call state machine and WebRTC signaling relay)
- **Utils** — shared logic reused by both REST and socket paths (e.g. `messageHelper.js` — updating a conversation and emitting `new-message` is identical whether the message came from `POST /messages/direct` or from a call ending)

### Domain model

```
User ──< Session (refresh tokens)
User ──< Friend >── User
User ──< Conversation >── User
                │
                ├──< Message (text | call, optionally with imgUrl)
                └──< Call (structured call history, mirrored into Message)
```

A `Message` with `type: "call"` carries a snapshot of the call (`callId`, `callType`, `status`, `duration`) so the chat feed can render a call-log bubble without a second round-trip to the `Call` collection.

```
backend/
├── src/
│   ├── config/          # swagger.js
│   ├── controllers/      # one per domain (auth, user, friend, conversation, message, call)
│   ├── handlers/          # callHandler.js - Socket.IO call state machine + WebRTC signaling relay
│   ├── libs/               # db.js - MongoDB connection
│   ├── middlewares/         # auth, socket auth, friendship/group checks, multer upload
│   ├── models/                # Mongoose schemas
│   ├── routes/                  # Express routers (REST)
│   ├── socket/                    # Socket.IO server setup, presence, message relay
│   ├── utils/                      # messageHelper.js - shared conversation/message update + emit logic
│   └── server.js
└── package.json
```

```
frontend/
├── src/
│   ├── components/     # chat, call, auth, sidebar, and shadcn/ui primitives
│   ├── pages/            # SignInPage, SignUpPage, ChatAppPage
│   ├── stores/             # zustand: auth, chat, call, socket, theme
│   ├── services/             # API client layer (chatService, callService, ...)
│   ├── lib/                    # axios instance (with auto-refresh), sound manager, utils
│   └── types/                    # shared TS types (chat, call, store)
└── package.json
```

## Getting Started

### Option 1 — Run with Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) and a MongoDB Atlas connection string (this project doesn't run Mongo in a container — it connects out to Atlas).

1. Clone the repository:
```bash
   git clone <your-repo-url>.git
   cd Moji
```

2. Create `.env` files from the examples and fill in the real values:
```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
```

3. Start the full stack:
```bash
   docker-compose up --build
```

4. Access the app:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5001](http://localhost:5001)
   - API Docs: [http://localhost:5001/swagger](http://localhost:5001/swagger)

### Option 2 — Run locally (without Docker)

**Prerequisites:** Node.js 20+, a MongoDB Atlas cluster (or any reachable MongoDB instance), a Cloudinary account

**Backend:**
```bash
cd backend
cp .env.example .env   # fill in MONGODB_CONNECTIONSTRING, ACCESS_TOKEN_SECRET, CLOUDINARY_*, CLIENT_URL
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL, VITE_SOCKET_URL
npm install
npm run dev
```

## Environment Variables

**Backend (`backend/.env`)**

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default `5001`) |
| `CLIENT_URL` | Frontend origin, used for CORS (Express + Socket.IO) |
| `MONGODB_CONNECTIONSTRING` | MongoDB Atlas connection string |
| `ACCESS_TOKEN_SECRET` | Secret used to sign/verify JWT access tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

**Frontend (`frontend/.env`)**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the REST API (e.g. `http://localhost:5001/api`) |
| `VITE_SOCKET_URL` | Base URL for the Socket.IO connection (no `/api` suffix) |

## API Overview

| Method | Endpoint | Description | Auth |
|--------|----------|--------------|:---:|
| POST | `/api/auth/signup` | Register a new user | ❌ |
| POST | `/api/auth/signin` | Log in, returns access token + sets refresh token cookie | ❌ |
| POST | `/api/auth/refresh` | Exchange the refresh token cookie for a new access token | ❌ |
| POST | `/api/auth/signout` | Revoke the current refresh token | ❌ |
| GET | `/api/users/me` | Get the current user | ✅ |
| GET | `/api/users/search` | Find a user by exact username | ✅ |
| POST | `/api/users/uploadAvatar` | Upload/replace avatar | ✅ |
| GET | `/api/friends` | List friends | ✅ |
| GET | `/api/friends/requests` | List sent + received friend requests | ✅ |
| POST | `/api/friends/requests` | Send a friend request | ✅ |
| POST | `/api/friends/requests/:requestId/accept` | Accept a friend request | ✅ |
| POST | `/api/friends/requests/:requestId/decline` | Decline a friend request | ✅ |
| GET | `/api/conversations` | List the current user's conversations | ✅ |
| POST | `/api/conversations` | Create a direct or group conversation | ✅ |
| GET | `/api/conversations/:conversationId/messages` | Cursor-paginated message history | ✅ |
| PATCH | `/api/conversations/:conversationId/seen` | Mark a conversation as seen | ✅ |
| POST | `/api/messages/direct` | Send a direct (1-1) message | ✅ |
| POST | `/api/messages/group` | Send a group message | ✅ |
| POST | `/api/messages/uploadImage` | Upload an image to attach to a message | ✅ |
| GET | `/api/calls/:conversationId` | Call history for a conversation | ✅ |

Full request/response schemas are available in Swagger (see below).

## API Documentation

Interactive API documentation (Swagger UI) is available once the backend is running:

http://localhost:5001/swagger

To test authenticated endpoints: call `POST /auth/signin` to obtain an access token, then click **Authorize** in the Swagger UI and enter `Bearer <access-token>`.

## Socket.IO Events

Authenticated over the initial handshake (`socket.handshake.auth.token`), verified the same way as REST access tokens.

**Client → Server**

| Event | Payload | Description |
|---|---|---|
| `join-conversation` | `conversationId` | Join the room for a conversation (e.g. right after creating one) |
| `call:invite` | `{ conversationId, calleeId, type }` | Start a call |
| `call:accept` / `call:reject` / `call:cancel` / `call:end` | `{ callId }` | Call lifecycle actions |
| `call:offer` / `call:answer` / `call:ice-candidate` | `{ callId, to, sdp / candidate }` | WebRTC signaling (server only relays, never inspects) |
| `call:video-toggle` | `{ callId, to, enabled }` | Explicitly signal camera on/off (not derivable from WebRTC track events) |

**Server → Client**

| Event | Payload | Description |
|---|---|---|
| `online-users` | `string[]` | Full list of currently online user IDs |
| `new-message` | `{ message, conversation, unreadCounts }` | New text/image/call message in a conversation |
| `new-group` | `conversation` | Added to a new group |
| `call:ringing` / `call:incoming` / `call:accepted` / `call:rejected` / `call:cancelled` / `call:ended` / `call:timeout` / `call:busy` / `call:unavailable` / `call:error` | varies | Call lifecycle updates |
| `call:offer` / `call:answer` / `call:ice-candidate` / `call:video-toggle` | varies | Relayed WebRTC signaling |

## Notable Design Decisions

- **Call history reuses the message pipeline** — rather than building a parallel "call log" delivery system, every call termination creates a `Message` with `type: "call"` and pushes it through the exact same `updateConversationAfterCreateMessage` + `emitNewMessage` helpers used by regular messages. It shows up in the chat feed, bumps unread counts, and syncs across devices for free.
- **Camera on/off is explicitly signaled, not inferred** — disabling a local `MediaStreamTrack` (`track.enabled = false`) only makes the remote peer receive black frames; it does **not** reliably fire the track's `mute`/`unmute` events on the receiving end. Camera state is instead broadcast over a dedicated `call:video-toggle` Socket.IO event so the UI (avatar vs. video feed) updates correctly for both sides.
- **Video elements are always mounted, visibility toggled via CSS** — conditionally rendering `<video>` based on stream/call state caused a real bug: when a `localStream`/`callState` update landed across two separate React renders (common when an `await` sits between them, e.g. `createOffer`), the video element could mount *after* the state that would've attached `srcObject` to it, silently leaving it blank. Keeping the element always in the DOM and hiding it with CSS (instead of unmounting) sidesteps the whole class of timing bug.
- **Rotating opaque refresh tokens, not JWT** — refresh tokens are random bytes stored server-side per `Session`, decoupled from the short-lived (15 min) JWT access token. This makes per-session revocation trivial (`Session.deleteOne` on logout) without needing a JWT blocklist.
- **Friend-gated messaging** — both `/messages/direct` and conversation creation run through a `checkFriendShip` middleware that verifies every recipient/member is already a friend, preventing unsolicited messages from strangers.
- **WebRTC is peer-to-peer (mesh-free by design, currently 1-1 only)** — the signaling server only relays SDP offers/answers and ICE candidates between exactly two peers; it never touches media. STUN (Google) + a public TURN fallback (Open Relay Project, for restrictive NATs) are used for connectivity, keeping the server stateless with respect to media entirely.

## License

This project is for portfolio purposes.