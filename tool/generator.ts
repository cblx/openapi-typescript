import { OpenAPIObject, SchemaObject } from 'openapi3-ts';
import { ClientType } from './client-type';
import { OpenApiTypeScriptConfig } from './config';
import { EnumType } from './enum-type';
import { ModelType } from './model-type';
import { SolutionContext } from './main-context';
import { organizeActionsInClients } from './organize';
import * as path from 'path';
import fetch from 'node-fetch';
import { FileManager } from './file-manager';
import * as colors from 'colors';

export async function generateFromEndpoint(config: OpenApiTypeScriptConfig){
    let defEndpoint = config.url;
    let response = await fetch(defEndpoint);
    let json: OpenAPIObject = await response.json();
    generate(json, config);
}

export async function generate(json: OpenAPIObject, config: OpenApiTypeScriptConfig) {
    const fileManager = new FileManager(config.outputDir);
    fileManager.write('definition.ts', `export const openApiDefinition = ${JSON.stringify(json, null, 2)};`);
  
    const mainContext = new SolutionContext();
    
    const organizedClients = organizeActionsInClients(json);

    for(let c in organizedClients){
        mainContext.services.push(new ClientType(c, organizedClients[c].actions, mainContext, config));
    }

    for(let id in json.components.schemas){
        let schema: SchemaObject = json.components.schemas[id];
        if ('enum' in schema) {
            mainContext.modelsAndEnums[id] = new EnumType(id, schema);
        }else{
            mainContext.modelsAndEnums[id] = new ModelType(id, schema, mainContext);
        }
    }

    const result = mainContext.genereate();
    const indexes: { [path: string]: string } = {};
    for(let filePath in result){
        const dir = path.dirname(filePath);
        indexes[dir] = indexes[dir] || '';
        indexes[dir] += `export * from './${path.basename(filePath).replace('.ts', '')}';\n`;
        fileManager.write(filePath, result[filePath]);
    }

    for(let indexDir in indexes){
      const finalPath = path.join(indexDir, 'index.ts');
      fileManager.write(finalPath, indexes[indexDir]);
    }

    fileManager.deleteOldFiles();
    fileManager.saveState();
    console.log();
    console.log(colors.gray('GENERATION COMPLETED!'));
}