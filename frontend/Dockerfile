FROM node:22-alpine

WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application
COPY . .

EXPOSE 5173

# Start Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]