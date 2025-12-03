# syntax=docker/dockerfile:1 

# Use slim images to reduce vulnerabilities
# hadolint ignore=DL3007
# docker-scan/ignore
FROM node:22-bookworm-slim AS builder                                                                                       
WORKDIR /src                                                                                                            
COPY package*.json ./                                                                                                   
RUN npm install                                                                                                         
COPY . .                                                                                                               
RUN npm run build

# docker-scan/ignore
FROM node:22-bookworm-slim                                                                                                  
WORKDIR /app                                                                                                            
COPY package*.json ./                                                                                                   

# Install browser dependencies + TLS client requirements
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    # Browser dependencies for Playwright
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxkbcommon0 \
    libasound2 \
    libcups2 \
    xvfb \
    # TLS client requirements (CycleTLS Go binary)
    ca-certificates \
    libssl3 \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*
                                                                                                                    
ARG SUNO_COOKIE             
RUN if [ -z "$SUNO_COOKIE" ]; then echo "Warning: SUNO_COOKIE is not set. You will have to set the cookies in the Cookie header of your requests."; fi                                           
ENV SUNO_COOKIE=${SUNO_COOKIE}

# Production environment
ENV NODE_ENV=production

# Disable GPU acceleration for Docker environment
ENV BROWSER_DISABLE_GPU=true

RUN npm install --only=production                                                                                       
                                                                                                                    
# Install Chromium for Playwright (CAPTCHA fallback)
RUN npx playwright install chromium                                                                                     
                                                                                                                    
COPY --from=builder /src/.next ./.next                                                                                  
EXPOSE 3000                                                                                                             
CMD ["npm", "run", "start"]