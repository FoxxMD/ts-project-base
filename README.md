A project base for my typescript projects.

Clone this repository to have a batteries-included, **commonjs-based** typescript project base ready to go.

# Features

## Config

* Import ENV variables from '.env' using [dotenv](https://github.com/motdotla/dotenv)
* Optionally use YAML configuration file located in `PROJECT_DIR/data/config.yaml` (or `/config` mounted volume in docker container)
* Strongly-typed config structure
  * Build using TS interface in [`OperatorConfig.ts`](/src/common/infrastructure/OperatorConfig.ts)
  * Generate [JSON Schema](https://json-schema.org/) for config using `yarn run schema` that can be explored/validated with [Atlassian Json Schema Viewer](https://json-schema.app/start)
* Yaml Document object allows writing back to config if corret permissions are available

## Logging

[winstonjs](https://github.com/winstonjs/winston) for logging. 

* Out-of-box output to console, rotating file, and duplex stream
  * Each output can be configured indepedently (level, etc...) in [config](#config) `logging` property
  * Use `logger.stream().on('log')` to get Log object and final, formatted log message
* Opinionated, useful logging format
  * Timestamp is localized based on system timezone or `TZ` environmental variable (see [TZ identifier](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List))
  * Log levels are padded
  * Nested/chained labels based on child logger IE
    * `logger.child({labels: ['MyChild']}, mergeArr}) => '[MyParent][MyChild] A log message'`
  * Logging error message produces formatted error message and stack trace
    * ErrorsWithCause log cause chain with prefix `Caused by => ...`
* Meta (second arg) passed to logging methods is printed as JSON at end of the message

## Database

* Uses [Sequelize](https://sequelize.org/) and defaults to sqlite file in data folder
  * Logging tied into winston
* [umzug](https://github.com/sequelize/umzug) configured for migrations
* Sample `User` model and migration included

## Docker

* Base uses [Linuxserver.io](https://www.linuxserver.io/) alpine 3.17 [base image](https://github.com/linuxserver/docker-baseimage-alpine)
    * Provides easy [permission management when using linux hosts](https://docs.linuxserver.io/general/understanding-puid-and-pgid) with the `PUID` and `PGID` ENV variables
    * Proper init and OS signal handling using [s6](https://skarnet.org/software/s6/)
* Automatically copies [`config.yaml.example`](/config/config.yaml.example) into mounted config volume if no other config files present
* 133MB image, uncompressed

## Deploy

* Automated docker image build and push to registry using [Github Actions](/.github/dockerhub.yml.example)
  * Pushes `main` branch as tag `latest`. `edge` branch as tag `edge`
  * Builds multi-platform variants: x86_64 and arm64
  * Pushes to [Dockerhub](https://hub.docker.com/) using actions secret `DOCKER_USERNAME` and `DOCKER_PASSWORD`
    * Add under Github -> REPO -> Settings -> Secrets and variables -> Actions
  * Pushes to [Github Container Registry (ghcr.io)](https://github.com/features/packages)
    * Github -> REPO -> Settings -> Actions -> General
      * Check `Actions permissions -> Allow all actions and reusable workflows`
      * Check `Workflow Permissions -> Read and write permissions`
      * Check `Allow Github Actions to create and approve pull requests`
