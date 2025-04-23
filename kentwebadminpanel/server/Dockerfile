FROM node:18-buster-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --only=production && \
    npm uninstall bcrypt && \
    npm install bcrypt --build-from-source

COPY . .

RUN mkdir -p logs uploads

RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -m nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["node", "src/index.js"] 