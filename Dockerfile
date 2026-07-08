FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public
COPY data ./data
COPY docs ./docs
ENV PORT=3333
EXPOSE 3333
CMD ["node", "src/server.js"]
