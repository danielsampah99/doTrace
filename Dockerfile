# using the official bun image
FROM --platform= oven/bun:1 AS base
WORKDIR /app

# install deps into a temp directory to cache and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# exclude dev dependencies when installing for prod
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory and all non-ignored project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# build the application
ENV NODE_ENV=production
RUN bun run build

# copy prod deps and source code into image.
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/src/index.ts .
COPY --from=prerelease	/app/dist ./dist
COPY --from=prerelease /app/bun.lock .

# RUN the app.
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "dist/index.js" ]
