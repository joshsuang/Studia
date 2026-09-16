# Studia

**A clean, focused study dashboard built to help you study smarter and stay focused.**

Studia brings your study timer, tasks, statistics, and settings together in one simple workspace.

---

## Features

### Pomodoro Timer

Stay focused with a built-in Pomodoro timer.

- Focus sessions
- Short breaks
- Long breaks
- Customizable durations
- Start, pause, resume, reset, and skip
- Automatic session transitions
- Session tracking

### Dashboard

Get a quick overview of your study progress.

- Today's study time
- Completed focus sessions
- Current streak
- Study progress
- Quick access to your timer and tasks

### Tasks

Keep your study workload organized.

- Create tasks
- Complete tasks
- Delete tasks
- View active tasks
- View completed tasks

### Statistics

Understand your study habits over time.

- Daily study time
- Weekly study time
- Completed sessions
- Study activity
- Current streak

### Settings

Customize Studia to fit the way you study.

- Focus duration
- Short break duration
- Long break duration
- Long break interval
- Automatic breaks
- Automatic focus sessions
- Notifications
- Sound preferences
- Appearance settings

### Responsive Design

Studia is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile

The interface automatically adapts to smaller screens.

---

## Design

Studia follows a simple principle:

> **Less distraction. More focus.**

The interface is designed to be:

- Minimal
- Clean
- Modern
- Fast
- Easy to use
- Student-focused

The goal is to keep the important information visible without filling the screen with unnecessary elements.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| TypeScript | Type-safe development |
| Vite | Development and production build |
| Tailwind CSS | Styling |
| Lucide React | Icons |
| Recharts | Statistics and charts |
| Framer Motion | Animations |

---

## Getting Started

### Requirements

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/studia.git
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Enter the project

```bash
cd studia
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Vite will give you a local address, usually:

```text
http://localhost:5173
```

Open that address in your browser.

---

## Production Build

To create a production build:

```bash
npm run build
```

The production files will be generated inside:

```text
dist/
```

You can also preview the production build locally:

```bash
npm run preview
```

---

## Development Workflow

After making changes to the application:

```bash
git add .
git commit -m "Describe your changes"
git push
```

For example:

```bash
git add .
git commit -m "Improve mobile dashboard"
git push
```

If your repository is connected to Vercel, pushing to the main branch will automatically trigger a new deployment.

---

## Project Structure

The project follows a standard React + Vite structure.

```text
studia/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

The exact structure may change as Studia continues to develop.

---

## Git Commands

### Check your current changes

```bash
git status
```

### See recent commits

```bash
git log --oneline -10
```

### Save changes to Git

```bash
git add .
git commit -m "Describe your changes"
```

### Push changes to GitHub

```bash
git push
```

### Pull the latest version from GitHub

If another device or AI agent has changed the project:

```bash
git pull
```

---

## Deployment

Studia can be deployed using Vercel.

Recommended Vercel settings for this Vite project:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

The application should successfully build with:

```bash
npm run build
```

---

## Development Status

**Status: Active Development**

Studia is still being developed. Features, UI improvements, and performance optimizations may continue to change.

---

## Roadmap

Possible future improvements include:

- [ ] More detailed study analytics
- [ ] Custom study goals
- [ ] Calendar integration
- [ ] More timer customization
- [ ] Sound and notification customization
- [ ] Improved mobile experience
- [ ] Cloud synchronization
- [ ] Account-based data storage
- [ ] More productivity insights

---

## Contributing

Studia is currently a personal project.

If you are working on the project, please keep changes consistent with the existing design and architecture.

Before committing changes, make sure the application builds successfully:

```bash
npm run build
```

---

## License

This project is currently not licensed for redistribution.

---

<p align="center">
  <strong>Studia</strong><br>
  Study smarter. Stay focused.
</p>