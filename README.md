# TeacherMary's Reminders & Tasks 📚✨

A centralized productivity and lesson organization system built for teachers and educators. Manage curriculum planning, daily to-dos, student reminders, interactive notes with drawing & media, Pomodoro focus sessions, daily habits, and synchronized timelines.

---

## 🌟 Key Features

- **✅ Task Management & Subtasks**: Create tasks with NLP parsing, priority levels, customizable subject/department categories, interactive subtasks with progress bars, and deadline filtering (*Today, Tomorrow, This Week, Next Week, This Month, Overdue*).
- **📝 Rich Notes & Whiteboard**: Write notes with rich text formatting, interactive checklists, markdown tables, audio voice recordings, image attachments, and a full-featured drawing canvas. Categorize notes into custom color-coded folders with dedicated educational icons.
- **🎯 Today's Focus & Pomodoro**: Dedicated focus dashboard with customizable Pomodoro timers, strict focus mode, and motivational progress tracking.
- **🌱 Habit Routines & Mascot Pet**: Build healthy classroom and personal routines with daily streaks and an interactive gamified companion pet.
- **📅 Visual Timeline & Calendar**: Keep track of deadlines, class periods, meetings, and sync seamlessly with Google Calendar.
- **🔔 Notifications & Sound Alerts**: Configurable sound chimes, reminders, and motivational feedback on task completion.
- **💾 Offline-Ready Persistence**: All your data is saved automatically to local storage with export/import capabilities.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (version 18 or 20+) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000` (or the port specified in terminal).

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

This compiles the project into the `dist/` directory, ready to be hosted statically anywhere. You can preview the production build locally with:

```bash
npm run preview
```

---

## 🚢 Deploying to GitHub

### Option 1: Automatic Deployment via GitHub Actions (Recommended)

This repository includes a pre-configured GitHub Actions workflow in `.github/workflows/deploy.yml`.

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit - TeacherMary's Reminders and Tasks"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository, go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The workflow will automatically trigger, build the application, and publish your site at:
   `https://<your-username>.github.io/<your-repo-name>/`

### Option 2: Deploying to Vercel or Netlify

- **Vercel**: Import the GitHub repository at [vercel.com/new](https://vercel.com/new). Framework preset is **Vite**, build command is `npm run build`, and output directory is `dist`.
- **Netlify**: Connect your GitHub repository at [netlify.com](https://www.netlify.com). Set the build command to `npm run build` and publish directory to `dist`.

---

## 🛠️ Built With

- **[React 19](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)**
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Modern styling
- **[Lucide React](https://lucide.dev/)** - Clean iconography
- **[Canvas Confetti](https://github.com/catdad/canvas-confetti)** - Milestone celebration animations

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
