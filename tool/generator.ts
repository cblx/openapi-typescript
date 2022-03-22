import { OpenAPIObject, SchemaObject } from 'openapi3-ts';
import { ClientType } from './client-type.js';
import { OpenApiTypeScriptConfig } from './config.js';
import { EnumType } from './enum-type.js';
import { ModelType } from './model-type.js';
import { SolutionContext } from './main-context.js';
import { organizeActionsInClients } from './organize.js';
import * as path from 'path';
import fetch from 'node-fetch';
import { Agent } from 'https';
import { FileManager } from './file-manager.js';
import { EOL } from 'os';
import colors from 'chalk';

//import { RequestInfo, RequestInit } from "node-fetch";
//const fetch = (url: RequestInfo, init?: RequestInit) =>  import("node-fetch").then(({ default: fetch }) => fetch(url, init));

export async function generateFromEndpoint(config: OpenApiTypeScriptConfig) {
    let defEndpoint = config.url;
    let json: OpenAPIObject;
    try {
        let response = await fetch(defEndpoint, {
            agent: new Agent({ rejectUnauthorized: false })
        });
        json = <OpenAPIObject>(await response.json());
    } catch (err) {
        console.log(colors.red('Could not fetch OpenApi definition from ' + defEndpoint));
        console.log(err.message);
        return;
    }
    generate(json, config);
}

export async function generate(json: OpenAPIObject, config: OpenApiTypeScriptConfig) {
    const fileManager = new FileManager(config.outputDir);
    if (config.generateComponents?.definitionConst) {
        fileManager.write('definition.ts', `export const openApiDefinition = ${JSON.stringify(json, null, 2)};`);
    }
    if (config.generateComponents?.schemasConst) {
        fileManager.write('schemas.ts', `export const schemas = ${JSON.stringify(json.components?.schemas || {}, null, 2)};`);
    }

    const mainContext = new SolutionContext();

    const organizedClients = organizeActionsInClients(json);

    for (let c in organizedClients) {
        mainContext.services.push(new ClientType(c, organizedClients[c].actions, mainContext, config));
    }

    for (let id in json.components?.schemas) {
        let schema: SchemaObject = json.components.schemas[id];
        if ('enum' in schema) {
            mainContext.modelsAndEnums[id] = new EnumType(id, schema, config);
        } else {
            mainContext.modelsAndEnums[id] = new ModelType(id, schema, mainContext, config);
        }
    }

    const result = mainContext.genereate();
    const indexes: { [path: string]: string } = {};
    for (let filePath in result) {
        const dir = path.dirname(filePath);
        indexes[dir] = indexes[dir] || '';
        indexes[dir] += `export * from './${path.basename(filePath).replace('.ts', '')}';${EOL}`;
        fileManager.write(filePath, result[filePath]);
    }
    
    if (config?.generateComponents?.index) {
        for (let indexDir in indexes) {
            const finalPath = path.join(indexDir, 'index.ts');
            fileManager.write(finalPath, indexes[indexDir]);
        }
    }

    fileManager.deleteOldFiles();
    fileManager.saveState();
    console.log();
    console.log(colors.gray('GENERATION COMPLETED!'));
}