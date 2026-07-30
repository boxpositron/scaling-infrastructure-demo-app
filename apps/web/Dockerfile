FROM node:22-alpine AS build
WORKDIR /app

# Reoclo builds with the repository root as the Docker context, so every path
# here is relative to the repo root, not to apps/web.
# VITE_API_BASE is the public URL of the api app, baked into the bundle here.
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE

COPY apps/web/package.json ./
RUN npm install
COPY apps/web/ ./
RUN npm run build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
