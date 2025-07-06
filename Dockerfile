###################
# BUILD FOR LOCAL DEVELOPMENT
# --
# Dockerfile that can be used in local development (in combination with a docker-compose.yml file)
# AND also creates a Docker image optimized for production.
###################

ARG BASE_IMAGE=node:22-alpine

FROM $BASE_IMAGE AS build

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
# COPY .npmrc ./

ARG NPM_TOKEN

ENV NODE_OPTIONS="--max_old_space_size=2048"

# Configure npm and install dependencies
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    NPM_TOKEN=$NPM_TOKEN npm ci

COPY . .

RUN npm run build

RUN NPM_TOKEN=$NPM_TOKEN npm ci --omit=dev

####################
## PRODUCTION
####################

FROM $BASE_IMAGE AS production

# Copy the bundled code from the build stage to the production image
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/public ./dist/public
COPY --from=build /app/node_modules ./node_modules

# Start the server using the production build
CMD [ "node", "dist/main" ]
