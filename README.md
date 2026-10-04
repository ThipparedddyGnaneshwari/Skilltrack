# SkillTrack — Skilling Outcomes & Impact Platform

> Prototype for Smart India Hackathon problem statement SIH26135 (Government of Maharashtra): "Difficulties in tracking employment outcomes, skill gaps, and the impact of skilling initiatives".

Longitudinal skilling-outcomes tracking: trainee self-reporting, employer verification, and an admin analytics / decision-support dashboard.
**Stack:** React + Vite + MUI + Recharts + Leaflet (frontend) · Flask + SQLAlchemy + SQLite + pandas/scikit-learn (backend). No API keys, Docker, or external services needed.

## Run it (Windows; needs only VS Code, Python, Node.js)
Terminal 1:
```bash
cd frontend
npm install
npm start
```
Terminal 2:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Mac/Linux: activate with `source venv/bin/activate`.
Frontend: http://localhost:5173 · Backend: http://localhost:5000

The SQLite database is created and seeded automatically on first run (180 trainees, 10 providers, 10 courses, 20 employers, placements).

## Demo credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@skilltrack.demo | Admin@123 |
| Trainee | trainee@skilltrack.demo | Trainee@123 |
| Employer | employer@skilltrack.demo | Employer@123 |

These are created (hashed) automatically at backend start-up if missing, even on an existing database. On the login page, the "Use ... Demo" buttons fill the form. Trainee and employer signup is at `/signup`; admin accounts cannot be self-registered.

After pulling this version run `npm install` again in `frontend` (new dependency: @mui/icons-material).

## Demo flow
1. Admin → Overview KPIs, filters, charts → District map popups → Providers & courses → Skill gaps → Risk analysis → Trainees → View profile (Aarav Patil, ID 1).
2. Trainee (Aarav) → journey timeline → update status (Employed) → creates an employer verification request. Give consent.
3. Employer → Verify / Reject / Request correction → Admin KPIs (verification rate) update.

## Environment variables
`backend/.env.example` (copy to `.env`, optional): `SECRET_KEY`, `DATABASE_URL` (SQLite default; point to Postgres/Supabase later), `OPENAI_API_KEY` / `GEMINI_API_KEY` (unused; reserved). `frontend/.env.example`: `VITE_API_URL`.
To reset data, stop the backend and delete `backend/instance/skilloutcomes.db`.

## AI/ML
Risk model: scikit-learn logistic regression on attendance, assessment, certification, experience, duration, age and follow-up response, trained on the demo cohort. Risk factors and skill-gap recommendations are rule-based. *Prototype prediction, not a final decision.*

## Prototype limitations (not production)
Simple signed-token auth with seeded accounts; no refresh, rate limiting, audit log or encryption at rest. Follow-ups are computed, not sent (no real SMS/WhatsApp/email). Salary progression chart is simulated. Seed data is synthetic. Not yet built: Employers and Follow-ups admin pages, notification center (header shows sample notifications), district-level skill-gap breakdown, date-range/age/batch filters, trainee profile editing, employer skill feedback form, demo-mode mock data.

## Troubleshooting
- "Unable to connect to the server": start the Flask backend.
- `python` not found: try `py -m venv venv`.
- Port in use: change the port in `app.py` / `vite.config.js` and `VITE_API_URL`.
