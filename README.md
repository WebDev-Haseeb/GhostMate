# GhostMate 👻

**Anonymous Conversations, Real Connections**

Connect anonymously, chat freely, and disappear daily. GhostMate keeps your identity safe while you explore genuine human connections.

## 🌟 Features

- **Anonymous Daily IDs**: Every user gets a unique 8-digit ID that resets at midnight
- **5 Chats Per Day**: Connect with up to 5 new people daily
- **Mutual Favorites**: Build lasting connections through mutual favorites and streaks
- **Stories**: Share meaningful moments anonymously
- **Random Connect**: Instantly pair with random active users
- **Privacy First**: No permanent chat logs, your data is ephemeral

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ with App Router & TypeScript
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Cloud Functions)
- **Styling**: Vanilla CSS with custom design system
- **PWA**: Progressive Web App with offline support
- **Deployment**: Vercel (frontend) + Firebase (backend)

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

### Generate Icons

To regenerate PWA icons from the ghostmode.svg logo:

```bash
node scripts/generate-icons.js
```

## 📱 PWA Features

- Installable on mobile and desktop
- Offline support with service worker
- Fast performance with aggressive caching
- Mobile-first responsive design

## 🎨 Design System

GhostMate uses a permanent dark mode with:
- **Background**: Deep charcoal (#0a0a0a)
- **Theme**: Dark blue-purple (#1a1a2e)
- **Accent**: Muted purple (#7B68EE)
- **Typography**: Inter font family

## 📄 License

Copyright © 2024 GhostMate. All rights reserved.
