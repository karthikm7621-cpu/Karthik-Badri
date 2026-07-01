# Use an official lightweight Python slim image
FROM python:3.11-slim AS builder

# Prevent Python from writing pyc files to disc
ENV PYTHONDONTWRITEBYTECODE=1
# Prevent Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED=1

WORKDIR /build
COPY requirements.txt .

# Install dependencies into a local directory for efficient layer caching
RUN pip install --user --no-cache-dir --default-timeout=100 -r requirements.txt

# Final production stage
FROM python:3.11-slim

# Create a non-root user and group
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser
USER appuser

WORKDIR /app

# Copy installed dependencies from builder
COPY --chown=appuser:appgroup --from=builder /root/.local /home/appuser/.local

# Update PATH to include the installed binaries
ENV PATH=/home/appuser/.local/bin:$PATH

# Copy the application code
COPY --chown=appuser:appgroup . .

EXPOSE 8000

# Gunicorn entrypoint:
# -w 4: Spawns 4 worker processes to handle incoming requests concurrently.
#       This utilizes multiple CPU cores effectively.
# --threads 2: Each worker uses 2 threads, which helps manage I/O bound operations 
#              (like network requests) without blocking the entire worker process.
CMD ["gunicorn", "-w", "4", "--threads", "2", "-b", "0.0.0.0:8000", "wsgi:app"]
