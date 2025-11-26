FROM node:18-alpine

WORKDIR /app

# Install y-websocket
RUN npm install y-websocket

# Expose WebSocket port
EXPOSE 9001

# Run the server
CMD ["npx", "y-websocket"]