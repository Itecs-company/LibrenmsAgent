# Build stage for the Vite React application
FROM node:20-alpine AS build
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

# Production stage serving static assets with Nginx
FROM nginx:stable-alpine

# Remove default configuration and add our own SPA-friendly config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
