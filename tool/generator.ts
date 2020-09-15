import { OpenAPIObject, SchemaObject } from 'openapi3-ts';
import { ClientType } from './client-type';
import { OpenApiTypeScriptConfig } from './config';
import { deleteFolderRecursive } from './delete-folder-recursive';
import { EnumType } from './enum-type';
import { ModelType } from './model-type';
import { SolutionContext } from './main-context';
import { organizeActionsInClients } from './organize';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';

export async function generateFromEndpoint(config: OpenApiTypeScriptConfig){
    //Fetch the definition
    let defEndpoint = config.url;
    //let targetDir = config.outputDir;
    //let events = config.events || {};

    let response = await fetch(defEndpoint);
    let json: OpenAPIObject = await response.json();
    generate(json, config);
}

export async function generate(json: OpenAPIObject, config: OpenApiTypeScriptConfig) {
    deleteFolderRecursive(config.outputDir);

    // Write the definition used in a const, so the client can use it's data easily
    fs.writeFileSync(path.join(config.outputDir, 'definition.ts'), `export const openApiDefinition = ${JSON.stringify(json, null, 2)};`);
  
    const mainContext = new SolutionContext();
    
    const organizedClients = organizeActionsInClients(json);

    for(let c in organizedClients){
        mainContext.services.push(new ClientType(c, organizedClients[c].actions, mainContext, config));
    }

    for(let id in json.components.schemas){
        //let typeName = componentName.replace('[]', 'Array');
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

        const finalPath = path.join(config.outputDir, filePath);
        ensureDirectoryExistence(finalPath);
        fs.writeFileSync(finalPath, result[filePath]);
    }

    for(let index in indexes){
      const finalPath = path.join(config.outputDir, index, 'index.ts');
      fs.writeFileSync(finalPath, indexes[index]);
    }
}

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}
