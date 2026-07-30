FROM node:22-alpine
WORKDIR /app

# Reoclo builds with the repository root as the Docker context, so every path
# here is relative to the repo root, not to apps/api.
COPY apps/api/package.json ./
RUN npm install --omit=dev

COPY apps/api/ ./

EXPOSE 3000
CMD ["node", "app.js"]
