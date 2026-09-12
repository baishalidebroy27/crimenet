FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


COPY . .

# Run only uvicorn to save memory on Render free tier (Processing is now handled via BackgroundTasks)
CMD uvicorn app.main:app --host 0.0.0.0 --port 8000
