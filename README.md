<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Signal to Startup

**Turn market signals into startup opportunities — powered by Gemini AI**

</div>

Paste a news article, trend, or market shift and Signal to Startup surfaces the startup ideas, problems to solve, and execution plans hidden inside it.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A [Firebase project](https://console.firebase.google.com/) (for auth + data persistence)
- _(Optional)_ A [NewsAPI key](https://newsapi.org/) for the live feed feature

---

## Installation

### 1. Clone the repo

```bash
git clone https://github.com/your-username/signal-to-startup.git
cd signal-to-startup
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
# Required — get yours at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# Optional — enables the live news feed (https://newsapi.org)
NEWS_API_KEY=your_newsapi_key
```

### 4. Configure Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. Enable **Authentication** → Google sign-in provider.
3. Enable **Firestore Database** in production or test mode.
4. In your project settings, find your web app config and update `firebase-applet-config.json`:

```json
{
  "apiKey": "your_api_key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "your_sender_id",
  "appId": "your_app_id",
  "firestoreDatabaseId": "(default)"
}
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## Tech Stack

- **Framework:** Next.js 15 + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **AI:** Google Gemini (`@google/genai`)
- **Backend:** Firebase Auth + Firestore
