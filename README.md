# PlaniSup

A full-stack graduate study plan management platform built for Polytechnique Montréal. Students submit study plans that go through a structured multi-role approval workflow, with real-time validation at every step.

The platform was adopted by Polytechnique Montréal, who hired two team members to continue development post-graduation.

## Features

- Real-time validation engine that checks credit totals, module distribution, mandatory courses, and prerequisite conflicts against configurable institutional rules
- Multi-role sequential approval workflow: student → director → coordinator → admin agent → registrar
- Per-step chat and feedback system between student and each approver
- CAS (Central Authentication Service) integration with Polytechnique's SSO
- Web scraper that extracts, normalizes, and loads Polytechnique's full graduate course catalog into MongoDB

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular, TypeScript, SCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Auth | Polytechnique CAS (SSO) |
| Deployment | Polytechnique Montréal servers |

## Project Structure

```
├── frontend/          # Angular client
├── backend-express/   # Node.js REST API server
└── common/            # Shared types and interfaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- npm

### Installation

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend-express && npm install
```

### Running the App

```bash
# Start the backend
cd backend-express
npm start

# Start the frontend (separate terminal)
cd frontend
npm start
```

The app will be available at `http://localhost:4200`.

## Team

Built by a team of 5 as a capstone project in the Software Engineering program at Polytechnique Montréal.
