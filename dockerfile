FROM node:20-alpine AS builder
WORKDIR /build

COPY package.json package-lock.json ./

RUN npm ci 
COPY . .
RUN  npm run build 

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app


COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder --chown=node:node /build/dist ./dist
RUN chown node:node /app
USER node
EXPOSE 4000

CMD ["node","dist/index.js"]