FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


COPY . .

# Run both celery worker and uvicorn in the same container for Render free tier
CMD celery -A app.tasks.celery_tasks.celery_app worker --loglevel=info & uvicorn app.main:app --host 0.0.0.0 --port 8000
