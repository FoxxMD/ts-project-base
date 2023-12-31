import winston, {Logger} from "@foxxmd/winston";
import path from "path";
import {dataDir, projectDir} from "../index.js";
import {readFile} from "../../utils/io.js";
import {ErrorWithCause} from "pony-cause";
import {parseFromYamlToObject} from "./ConfigUtil.js";
import {SimpleError} from "../../utils/Errors.js";
import {OperatorConfig, OperatorJsonConfig, YamlOperatorConfigDocument} from "../infrastructure/OperatorConfig.js";
import {Document as YamlDocument} from "yaml";
import {createAjvFactory} from "../../utils/validation.js";
import {Schema} from "ajv";
import * as operatorSchema from '../schema/operator.json';
import merge from 'deepmerge';
import {LogLevel} from "../infrastructure/Atomic.js";
import {overwriteMerge} from "../../utils/index.js";
import {getLogger, AppLogger} from "../logging.js";

export const validateJson = <T>(config: object, schema: Schema, logger: AppLogger): T => {
    const ajv = createAjvFactory(logger);
    const valid = ajv.validate(schema, config);
    if (valid) {
        return config as unknown as T;
    } else {
        logger.error('Json config was not valid. Please use schema to check validity.', {leaf: 'Config'});
        if (Array.isArray(ajv.errors)) {
            for (const err of ajv.errors) {
                let parts = [
                    `At: ${err.dataPath}`,
                ];
                let data;
                if (typeof err.data === 'string') {
                    data = err.data;
                } else if (err.data !== null && typeof err.data === 'object' && (err.data as any).name !== undefined) {
                    data = `Object named '${(err.data as any).name}'`;
                }
                if (data !== undefined) {
                    parts.push(`Data: ${data}`);
                }
                let suffix = '';
                // @ts-ignore
                if (err.params.allowedValues !== undefined) {
                    // @ts-ignore
                    suffix = err.params.allowedValues.join(', ');
                    suffix = ` [${suffix}]`;
                }
                parts.push(`${err.keyword}: ${err.schemaPath} => ${err.message}${suffix}`);

                // if we have a reference in the description parse it out so we can log it here for context
                if (err.parentSchema !== undefined && err.parentSchema.description !== undefined) {
                    const desc = err.parentSchema.description as string;
                    const seeIndex = desc.indexOf('[See]');
                    if (seeIndex !== -1) {
                        let newLineIndex: number | undefined = desc.indexOf('\n', seeIndex);
                        if (newLineIndex === -1) {
                            newLineIndex = undefined;
                        }
                        const seeFragment = desc.slice(seeIndex + 5, newLineIndex);
                        parts.push(`See:${seeFragment}`);
                    }
                }

                logger.error(`Schema Error:\r\n${parts.join('\r\n')}`, {leaf: 'Config'});
            }
        }
        throw new SimpleError('Config schema validity failure');
    }
}

export const parseConfigFromSources = async () => {

    const initLogger = winston.loggers.get('init') as AppLogger;

    let configDoc: YamlOperatorConfigDocument
    let configFromFile: OperatorJsonConfig = {};

    const operatorConfig = `${dataDir}/config.yaml`;
    initLogger.debug(`Config File Location: ${operatorConfig}`);
    let rawConfig = '';
    try {
        rawConfig = await readFile(operatorConfig, {throwOnNotFound: false}) ?? '';
    } catch (e) {
        throw new ErrorWithCause('Could not read config file', {cause: e});
    }
    if(rawConfig === '') {
        initLogger.debug('Config file either does not exist or is empty.');
    }

    const [format, doc, yamlErr] = parseFromYamlToObject(rawConfig, {
        location: operatorConfig
    });

    if (doc === undefined && rawConfig !== '') {
        initLogger.error(`Could not parse file contents at ${operatorConfig} as YAML:`);
        initLogger.error(yamlErr);
        throw new SimpleError(`Could not parse file contents at ${operatorConfig} as JSON or YAML`);
    } else if (doc === undefined && rawConfig === '') {
        // create an empty doc
        configDoc = new YamlOperatorConfigDocument('', operatorConfig);
        configDoc.parsed = new YamlDocument({});
        configFromFile = {};
    } else {
        configDoc = doc as (YamlOperatorConfigDocument);

        try {
            configFromFile = validateJson(configDoc.toJS(), operatorSchema, initLogger) as OperatorJsonConfig;
        } catch (err: any) {
            initLogger.error('Cannot continue app startup because operator config file was not valid.');
            throw err;
        }
    }

    const mergedConfig = merge.all([parseConfigFromEnv(), configFromFile], {
        arrayMerge: overwriteMerge,
    }) as OperatorJsonConfig;

    return mergedConfig as OperatorConfig;
}

export const parseConfigFromEnv = (): OperatorJsonConfig => {
    return {
        logging: {
            level: process.env.LOG_LEVEL as (LogLevel | undefined)
        }
    }
}
