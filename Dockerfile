###################
# BUILD FOR LOCAL DEVELOPMENT
# --
# Dockerfile that can be used in local development (in combination with a docker-compose.yml file)
# AND also creates a Docker image optimized for production.
###################

ARG BASE_IMAGE=node:24-alpine

FROM $BASE_IMAGE AS build

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./
# COPY .npmrc ./

RUN npm install -g --no-audit --verbose pnpm

ARG NPM_TOKEN

RUN NPM_TOKEN=$NPM_TOKEN pnpm install

COPY . .

RUN npm run build

RUN NPM_TOKEN=$NPM_TOKEN pnpm prune --prod

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
