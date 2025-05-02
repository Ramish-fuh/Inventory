FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Create logs directory and ensure proper permissions
RUN mkdir -p /app/logs \
    && chmod 755 /app/logs

COPY . .

EXPOSE 5001

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["npm", "start"]