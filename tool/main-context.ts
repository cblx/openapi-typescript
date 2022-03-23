import { BaseContext } from './base-context.js';
import { ClientType } from './client-type.js';
import { GenerateSchemaFileOptions } from './generate-schema-file-options.js';
import { ModelType } from './model-type.js';
import { SchemaTypeBase } from './schema-type-base.js';
export class SolutionContext extends BaseContext {
    services: ClientType[] = [];
    constructor() {
        super();
    }

    genereate() : { [filePath: string]: string } {
        const result = {};
        for(let modelId in this.modelsAndEnums)        {
            let model = this.modelsAndEnums[modelId];
            result[model.getPath()] = model.write();
            if(model.typeConfig.generateSchemaFile){
                //result[model.getSchemaFilePath()] = model.writeSchemaFile(model.typeConfig.generateSchemaFile);
                this.generateSchemaFile(model, model.typeConfig.generateSchemaFile, result);
            }
            if(model.typeConfig.generateMetadataFile){
                result[model.getMetaFilePath()] = model.writeMetaFile();
            }
        }

        for(let service of this.services){
            result[service.getPath()] = service.write();
        }
        return result;
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