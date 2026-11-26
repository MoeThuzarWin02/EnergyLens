# EnergyLens

EnergyLens is an Energy Management System with a React frontend and FastAPI backend.

## Project Structure

```text
EnergyLens/
├── frontend/
└── backend/
```

## Frontend

Technology:
- React
- Vite
- Firebase

Run locally:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

## Backend

Technology:
- Python
- FastAPI
- Uvicorn
- Firebase Admin SDK

Install dependencies:

```bash
cd backend
python -m venv .venv
```

Activate on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install packages:

```bash
pip install -r requirements.txt
```

Start the API from the project root:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn main:app --app-dir .\backend --reload
```

Backend URL: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

Health check: http://127.0.0.1:8000/health

## Security

- Never commit `.env` files.
- Never commit Firebase service-account credentials.
- Keep private API keys outside Git.
- Use environment variables for sensitive configuration.

## Development

Frontend and backend are maintained in the same Git repository.
