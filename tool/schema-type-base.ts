import { SchemaObject } from "openapi3-ts";
import { EOL } from "os";
import { OpenApiTypeScriptConfig } from "./config.js";
import { GenerateSchemaFileOptions } from "./generate-schema-file-options.js";
import { TypeBase } from "./type-base.js";
export abstract class SchemaTypeBase extends TypeBase {
    public typeConfig: {
        generateMetadata?: boolean,
        generateMetadataFile?: boolean,
        generateSchemaFile?: boolean | GenerateSchemaFileOptions
    };
    constructor(
        id: string,
        public readonly schema: SchemaObject,
        config: OpenApiTypeScriptConfig
    ) {
        super(id);
        const defaultConfig = config.models?.default || {};
        const modelConfig = config?.models ? config.models[id] || {} : {};
        this.typeConfig = { ...defaultConfig, ...modelConfig };
    }
   
    getMetaFilePath() {
        return this.getPath().replace('.ts', '.meta.ts');
    }
    
    writeMetaFile(){
        const schema = this.schema;
        let content = ``;
        content += `export const ${this.name}_PROP_NAMES = {${EOL}`;
        const properties = [];
        for(let p in schema.properties){
            properties.push(`   ${p}: '${p}'`);
        }
        content += properties.join(`,${EOL}`);
        content += EOL;
        content += `}`;
        return content;
    }

    getSchemaFilePath() {
        return this.getPath().replace('.ts', '.schema.ts');
    }

    abstract writeSchemaFile(options: boolean | GenerateSchemaFileOptions) : string;
}