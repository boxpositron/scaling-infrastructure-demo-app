FROM node:22-alpine
WORKDIR /app

# Reoclo builds with the repository root as the Docker context, so every path
# here is relative to the repo root, not to apps/api.
COPY apps/api/package.json ./
RUN npm install --omit=dev

COPY apps/api/ ./

# Broken build layer for the recorded clip. The api has no build script, so this
# fails here with "Missing script: build". The agent reads the build log,
# identifies this layer, and proposes removing it. Build time failure only.
RUN npm run build

EXPOSE 3000
CMD ["node", "app.js"]
