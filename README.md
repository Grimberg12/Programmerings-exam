# Programmerings-exam
Programmeringseksamen 2. semester, ejendomsindvesteringsside. 


Programmerings-exam
Overview

This project is a full-stack application consisting of:

A PostgreSQL database (running in Docker)

A Node.js backend using Express

A simple API exposing database data

The system is designed to be reproducible on any machine with minimal setup.

Architecture

The system consists of three main layers:

Database layer (PostgreSQL via Docker)

Backend layer (Node.js + Express)

Frontend layer (currently optional / to be implemented)

The backend communicates with the database using the pg library.
The database runs inside a Docker container to ensure consistency across environments.

Project Structure
Programmerings-exam/
│
├── docker-compose.yml        # Starts PostgreSQL container
│
├── db/
│   └── init/
│       ├── 001_schema.sql    # Creates database tables
│       └── 002_seed.sql      # Inserts initial test data
│
├── backend/
│   ├── server.js             # Express server + API endpoints
│   ├── package.json          # Node dependencies
│   └── node_modules/         # Installed dependencies
│
└── frontend/                 # Reserved for frontend implementation

Technologies Used

Node.js (LTS)

Express

PostgreSQL

Docker Desktop

pg (Node PostgreSQL client)

Requirements

To run this project locally, you must install:

Git
https://git-scm.com/

Node.js (LTS version)
https://nodejs.org/

Docker Desktop
https://www.docker.com/products/docker-desktop/

No local PostgreSQL installation is required.

Setup Instructions (From Scratch)
1. Clone the repository
git clone <repository-url>
cd Programmerings-exam

2. Start the database (Docker)
docker compose up -d


This will:

Start a PostgreSQL container

Create database: examdb

Create user: postgres

Password: postgres

Expose database on port: 5433

To verify the container is running:

docker ps

3. Install backend dependencies
cd backend
npm install

4. Start backend server
npm run dev


The server will run at:

http://localhost:3000

Available API Endpoints
Health Check
GET /health


Example:

http://localhost:3000/health


Response:

{
  "ok": true,
  "message": "Server is running"
}

Get Users
GET /users


Example:

http://localhost:3000/users


Response:

{
  "ok": true,
  "users": [
    {
      "id": 1,
      "name": "Test User",
      "email": "test@example.com"
    }
  ]
}

Database Details

The database is automatically initialized using:

db/init/001_schema.sql
db/init/002_seed.sql


These scripts run automatically the first time the container starts.

If you need to fully reset the database:

docker compose down -v
docker compose up -d


This removes all data and recreates the database from scratch.

Stopping the System

Stop backend:
Press Ctrl + C in the terminal running Node.

Stop database:

docker compose down

Common Issues
Port Conflict on 5432

If PostgreSQL is installed locally, it may conflict with Docker.

This project runs Docker on port 5433 to avoid conflicts.

If you encounter authentication errors, ensure you are connecting to port 5433.

Development Notes

Backend runs locally via Node.

Database runs inside Docker.

Environment variables can be added later for production configuration.

Frontend folder is reserved for future UI implementation.

System Flow

Client sends HTTP request to backend.

Backend receives request via Express.

Backend queries PostgreSQL using pg.

Database returns result.

Backend sends JSON response to client.

Reproducibility

The project is designed so that any developer can:

Clone the repository

Run two commands

Have the system fully operational

No manual database setup is required.