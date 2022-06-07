import { OpenAPIObject } from 'openapi3-ts';
import { BaseContext } from './base-context.js';
import { ClientType } from './client-type.js';
import { OpenApiTypeScriptConfig } from './config.js';
import { GenerateSchemaFileOptions } from './generate-schema-file-options.js';
import { ModelType } from './model-type.js';
import { SchemaTypeBase } from './schema-type-base.js';
export class SolutionContext extends BaseContext {
    services: ClientType[] = [];
    constructor(
        private openApiObject: OpenAPIObject,
        private config: OpenApiTypeScriptConfig
    ) {
        super();
    }

    generate() : { [filePath: string]: string } {
        const files = {};
        for(let modelId in this.modelsAndEnums)        {
            let model = this.modelsAndEnums[modelId];
            files[model.getPath()] = model.write();
            if(model.typeConfig.generateSchemaFile){
                this.generateSchemaFile(model, model.typeConfig.generateSchemaFile, files);
            }
            if(model.typeConfig.generateMetadataFile){
                files[model.getMetaFilePath()] = model.writeMetaFile();
            }
            if(this.config.hooks?.generatingModelFiles){
                let customFiles = this.config.hooks.generatingModelFiles(model, this.openApiObject.components);
                for(let fileName in customFiles){
                    if(fileName in files){ throw `${fileName} already exists`; }
                    files[fileName] = customFiles[fileName];
                }
            }
            
        }

        for(let service of this.services){
            files[service.getPath()] = service.write();
        }
        return files;
    }

    private generateSchemaFile(model: SchemaTypeBase, options: boolean | GenerateSchemaFileOptions, result: { [key: string]: string }){
        const path = model.getSchemaFilePath();
        if(path in result){ return; }
        result[path] = model.writeSchemaFile(model.typeConfig.generateSchemaFile);
        if(model instanceof ModelType && typeof options === 'object' && options.includeRefs === true){
            const refTypes = model.getReferencedTypes();
            for(let t of refTypes){
                this.generateSchemaFile(t as SchemaTypeBase, options, result);
            }
        }
        
    }
}