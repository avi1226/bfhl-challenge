# SRM Full Stack Engineering Challenge - BFHL

This project implements a hierarchical nodes processing system with a REST API backend and a React-based frontend visualizer.

## Features
- **Backend API**: Processes node sequences (e.g., `A->B`), validates input, detects cycles, builds trees, and calculates depth.
- **Tree Visualization**: A nested recursive UI that displays the tree structure of valid hierarchies.
- **Cycle Detection**: Identifies cyclic groups and flags them in the UI.
- **Summary Statistics**: Provides counts for trees, cycles, and identifies the largest tree.
- **Premium UI**: Modern dark-mode design with glassmorphism and animations.

## Tech Stack
- **Frontend**: React (Vite), Axios, Lucide React (Icons), CSS3.
- **Backend**: Node.js, Express, CORS.

## Project Structure
```
/
├── server/      # Backend API (Express)
├── client/      # Frontend Visualizer (React)
└── README.md    # Instructions
```

## Setup and Running Locally

### 1. Prerequisites
- Node.js (v16+)
- npm

### 2. Run Backend
```bash
cd server
npm install
npm run dev
```
The server will start at `http://localhost:5000`.

### 3. Run Frontend
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## API Documentation

### POST `/bfhl`
Processes an array of node strings.

**Request Body:**
```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

**Response Example:**
```json
{
  "user_id": "fullname_ddmmyyyy",
  "email_id": "college@edu",
  "college_roll_number": "21CS1001",
  "hierarchies": [...],
  "invalid_entries": [...],
  "duplicate_edges": [...],
  "summary": {
    "total_trees": 1,
    "total_cycles": 0,
    "largest_tree_root": "A"
  }
}
```

## Deployment Instructions

### Backend (Render/Railway)
1. Push the code to a GitHub repository.
2. Link the repository to your hosting provider (Render, Railway, etc.).
3. Set the root directory to `server`.
4. Set the build command to `npm install`.
5. Set the start command to `npm start`.
6. **Important**: Update the `API_BASE_URL` in `client/src/App.jsx` to your hosted backend URL.

### Frontend (Vercel/Netlify)
1. Link the same repository to Vercel/Netlify.
2. Set the root directory to `client`.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Deploy.

## Submission Requirements
1. **GitHub Repository**: [Your Public Repo Link]
2. **Hosted API URL**: `https://your-backend.render.com`
3. **Hosted Frontend URL**: `https://your-frontend.vercel.app`
