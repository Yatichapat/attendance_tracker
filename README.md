# Attendance Tracker

Trial attendance system for web/mobile browser use with:
- Google OAuth login
- Signup form (first name, last name, role, email)
- Geofence restriction (`<= 200m` from authorized location)
- Session-based clocking for `morning`, `lunch`, `afternoon`, `evening`
- Clock actions for `in` and `out`
- Attendance history for later verification

## Tech Stack
- Backend: Django + SQLite
- Frontend: Next.js (App Router)

## Backend Setup
```bash
cd backend
/Users/saiyd/attendance_tracker/.venv/bin/python -m pip install -r ../requirements.txt
/Users/saiyd/attendance_tracker/.venv/bin/python manage.py migrate
/Users/saiyd/attendance_tracker/.venv/bin/python manage.py runserver
```

Create `backend/.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000

# Authorized attendance point
AUTHORIZED_LOCATION_LAT=13.7563
AUTHORIZED_LOCATION_LNG=100.5018
ATTENDANCE_RADIUS_METERS=200
```

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Optional `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

## Trial Workflow
1. Open `http://localhost:3000`
2. Click `Scan Face`
3. Fill signup form (name, role, email)
4. Click `Continue with Google`
5. Complete OAuth
6. Go to `scan` page and:
	- choose session (`morning/lunch/afternoon/evening`)
	- choose action (`in/out`)
	- complete face verification option
	- capture location
	- submit attendance
7. Verify records in attendance history and Django admin (`/admin`)

## API Endpoints
- `POST /api/profile/upsert/`
- `POST /api/attendance/clock/`
- `GET /api/attendance/records/?email=...`
- `GET /api/attendance/config/`

## Notes
- Geofence is enforced server-side and capped at 200 meters.
- Face recognition is implemented as a trial verification option flag in this version.