# Build stage for the Vite React application
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* .npmrc* ./
RUN npm install

# Copy source files
COPY . .

# Pass API key at build time for Vite define substitution
ARG API_KEY=""
ENV API_KEY=${API_KEY}

# Build the production bundle
RUN npm run build

# Runtime stage with Python agent and Nginx for the UI
FROM python:3.11-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install runtime packages
RUN apt-get update \ 
    && apt-get install -y --no-install-recommends nginx ca-certificates \ 
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY agent.py entrypoint.sh ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Remove default site to rely on our config
RUN rm -f /etc/nginx/sites-enabled/default || true \
    && chmod +x /app/entrypoint.sh

EXPOSE 80

CMD ["/app/entrypoint.sh"]
