# ---------------------------------------------------------
# STAGE 1: Builder
# ---------------------------------------------------------
FROM python:3.11-slim AS builder

# Prevent Python from writing pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system build dependencies (if required for C-extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy requirements file first for layer caching
# CACHE BUST: 2
COPY requirements.txt ml-requirements.txt ./

# Install dependencies into a local user directory
# We install build-essential just in case, and use no-cache-dir
# Limit parallel compilation to prevent OOM (used over 8GB) on Render
RUN MAKEFLAGS="-j 1" CMAKE_BUILD_PARALLEL_LEVEL=1 pip install --user --no-cache-dir --default-timeout=100 -r requirements.txt -r ml-requirements.txt

# ---------------------------------------------------------
# STAGE 2: Production
# ---------------------------------------------------------
FROM python:3.11-slim

# Create a non-root user and group for security (minimal attack surface)
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser

# Set working directory
WORKDIR /app

# Copy installed dependencies from the builder stage
COPY --from=builder /root/.local /home/appuser/.local

# Add local bin to PATH
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Copy the application code and set ownership
COPY --chown=appuser:appgroup . .

# Switch to the non-root user
USER appuser

# Expose the application port
EXPOSE 8000

# Health check to ensure the container is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Start the application using Gunicorn (production WSGI server)
CMD ["gunicorn", "-w", "4", "--threads", "2", "-b", "0.0.0.0:8000", "wsgi:app"]
