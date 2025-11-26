FROM node:18-alpine

WORKDIR /app

# Copy package files and install only ws dependency
COPY server.js .
RUN npm init -y && npm install ws

EXPOSE 9001

CMD ["node", "server.js"]
