# FLEXI Project — Student Task & Assignment Manager

A full-stack React + Node.js/Express + MongoDB CRUD application.

## Features
- Create, view, edit, and delete assignments
- Mark assignments pending/completed
- Filter all, pending, and completed tasks
- Search assignments
- Data persists in MongoDB

## Requirements
- Node.js 18+
- MongoDB Community Server running locally OR a MongoDB Atlas connection string
- MongoDB Compass (optional visual database manager)

## 1. Configure the backend
Open a terminal in `backend` and run:

```bash
npm install
```

Copy `.env.example` to `.env`, then set `MONGODB_URI`.
For a local MongoDB server, use:
`mongodb://127.0.0.1:27017/flexi_tasks`

Start the backend:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`.

## 2. Configure the frontend
Open a second terminal in `frontend` and run:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## 3. View data in MongoDB Compass
Connect to the same MongoDB URI. Open database `flexi_tasks`, collection `tasks`.
Create a task in the UI and refresh Compass to see the saved document.

## API
- `GET /api/tasks` — list tasks (optional `?status=pending|completed&q=search`)
- `GET /api/tasks/:id` — fetch one task
- `POST /api/tasks` — create task
- `PUT /api/tasks/:id` — update task
- `PATCH /api/tasks/:id/toggle` — toggle completion
- `DELETE /api/tasks/:id` — delete task
- `GET /api/health` — API and database status

## Notes
- The backend validates input and uses Mongoose models.
- Never commit your `.env` file or share your MongoDB password.
- If MongoDB isn't running locally, start MongoDB Community Server or use Atlas.
