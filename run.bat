@echo off
echo Starting CrimeNet Enterprise Data Layer (Neo4j, MongoDB, Redis)...
cd backend
docker-compose up -d neo4j mongodb redis
cd ..

echo Starting Backend API...
cd backend
call venv\Scripts\activate
start cmd /k "uvicorn app.main:app --reload --port 8000"

echo Starting Celery Background Worker...
start cmd /k "celery -A app.tasks.celery_tasks worker --loglevel=info --pool=solo"

echo Starting Frontend Dashboard...
cd ..\frontend
start cmd /k "npm run dev"

echo CrimeNet System is booting up!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
