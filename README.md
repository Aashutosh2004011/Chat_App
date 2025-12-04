# Mini Team Chat - Slack-like Real-time Chat Application

A full-stack real-time team chat application built with Next.js, featuring channels, real-time messaging, user authentication, and online presence tracking.

## Features

### Core Features
- **User Authentication**: Sign up and login with JWT-based authentication using NextAuth.js
- **Persistent Sessions**: Users remain logged in on page refresh
- **Channels**: Create, view, join, and leave channels
- **Real-time Messaging**: Messages appear instantly using polling mechanism (updates every 2 seconds)
- **Message History**: All messages are stored in PostgreSQL database
- **Pagination**: Load older messages without fetching everything at once
- **Online/Offline Presence**: See which users are currently online in each channel
- **Member Count**: View the number of members in each channel

### Bonus Features
- **Message Editing**: Edit your own messages
- **Message Deletion**: Delete your own messages (soft delete)
- **Responsive Design**: Works on desktop and mobile devices
- **Date Grouping**: Messages are grouped by date for better readability

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **NextAuth.js** for authentication

### Backend
- **Next.js API Routes**
- **Prisma ORM**
- **PostgreSQL** database
- **bcryptjs** for password hashing

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud-hosted)

## Setup and Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mini-team-chat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

You have two options for the database:

#### Option A: Use Prisma Dev (Local PostgreSQL in Docker)

```bash
npx prisma dev
```

This will start a local PostgreSQL instance.

#### Option B: Use a Cloud PostgreSQL Database

Get a free PostgreSQL database from one of these providers:
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)

Then update the `.env` file with your database URL.

### 4. Environment Variables

Create or update the `.env` file in the root directory:

```env
# Database URL - Replace with your PostgreSQL connection string
DATABASE_URL="your-postgresql-connection-string"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will create all the necessary tables in your database.

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Sign Up
- Navigate to the sign-up page
- Enter your email, username, and password
- Click "Sign Up"

### 2. Sign In
- Enter your email and password
- Click "Sign In"

### 3. Create a Channel
- Click "Create Channel" in the sidebar
- Enter a channel name and optional description
- Click "Create"

### 4. Join a Channel
- Click "Browse Channels"
- Click "Join" on any available channel

### 5. Send Messages
- Select a channel from the sidebar
- Type your message in the input box at the bottom
- Press Enter or click "Send"

### 6. Edit/Delete Messages
- Hover over your own messages
- Click the edit icon to edit or delete icon to delete

### 7. Load Older Messages
- Click "Load older messages" at the top of the message list
- This loads previous messages in batches of 50

## Project Structure

```
mini-team-chat/
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication routes
│   │   ├── channels/       # Channel CRUD operations
│   │   ├── messages/       # Message operations
│   │   ├── presence/       # Online presence tracking
│   │   └── socket/         # Socket.io placeholder
│   ├── auth/               # Auth pages (signin, signup)
│   ├── chat/               # Main chat page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (redirects)
│   └── providers.tsx       # Session provider
├── components/
│   └── chat/
│       ├── ChatInterface.tsx    # Main chat container
│       ├── ChannelList.tsx      # Channel sidebar
│       ├── MessageList.tsx      # Message display with pagination
│       ├── MessageInput.tsx     # Message input form
│       └── OnlineUsers.tsx      # Online presence indicator
├── lib/
│   ├── auth.ts             # Password hashing utilities
│   ├── auth-options.ts     # NextAuth configuration
│   ├── prisma.ts           # Prisma client singleton
│   └── socket.ts           # Socket.io configuration
├── prisma/
│   └── schema.prisma       # Database schema
├── types/
│   └── next-auth.d.ts      # NextAuth type extensions
└── .env                    # Environment variables
```

## Database Schema

The application uses the following database models:

- **User**: User accounts with authentication
- **Channel**: Chat channels
- **ChannelMember**: Many-to-many relationship between users and channels
- **Message**: Chat messages with soft delete support
- **Session**: NextAuth session storage
- **Account**: NextAuth account storage

## Real-time Messaging Implementation

This application uses **polling** instead of WebSockets for real-time updates:

- **Message Updates**: Poll every 2 seconds for new messages
- **Presence Updates**:
  - Heartbeat sent every 10 seconds
  - Status checked every 5 seconds
  - 30-second timeout for offline detection

This approach was chosen for:
- Easier deployment on serverless platforms like Vercel
- No need for persistent WebSocket connections
- Simpler implementation while maintaining real-time feel

## Design Decisions and Tradeoffs

1. **Polling vs WebSockets**:
   - Chose polling for easier deployment and serverless compatibility
   - Tradeoff: Slightly higher latency and more HTTP requests
   - Benefit: Works seamlessly on Vercel and similar platforms

2. **Soft Delete for Messages**:
   - Messages are marked as deleted rather than removed from database
   - Allows for potential future audit/recovery features

3. **In-Memory Presence Tracking**:
   - Online status stored in memory for simplicity
   - Tradeoff: Resets on server restart
   - For production: Use Redis for distributed presence tracking

4. **JWT-based Authentication**:
   - Session data stored in JWT tokens
   - Benefit: Stateless authentication, works well with serverless

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Import your repository on [Vercel](https://vercel.com)

3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Your secret key
   - `NEXTAUTH_URL`: Your production URL (e.g., https://your-app.vercel.app)

4. Deploy

5. Run migrations on your production database:
   ```bash
   npx prisma migrate deploy
   ```

### Deploy to Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Fly.io
- Render

## Limitations and Assumptions

1. **Presence Tracking**:
   - Uses in-memory storage (not suitable for multi-instance deployments)
   - For production, implement Redis-based presence tracking

2. **Polling Frequency**:
   - Set to 2 seconds for messages (configurable in MessageList.tsx)
   - Balance between real-time feel and server load

3. **Message Pagination**:
   - Loads 50 messages per page
   - Configurable in API route

4. **File Uploads**:
   - Not implemented (text messages only)
   - Can be added using services like Cloudinary or AWS S3

5. **Channel Types**:
   - All channels are public by default
   - Private channels schema exists but UI not fully implemented

## Future Enhancements

- Direct messaging between users
- File and image sharing
- Emoji reactions
- Thread replies
- Message search functionality
- User profiles and avatars
- Push notifications
- Markdown support in messages
- Code syntax highlighting
- @mentions and notifications

## License

MIT

## Author

Built as a full-stack internship assignment for Deeref
