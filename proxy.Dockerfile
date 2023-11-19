FROM oven/bun

WORKDIR /usr/src/app

COPY package.json ./
RUN bun install
COPY . .

ENV NODE_ENV production

RUN bun build ./src/http-proxy.ts --outdir ./dist --target bun
CMD ["bun", "run", "dist/http-proxy.js"]