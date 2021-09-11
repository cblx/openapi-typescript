import { SchemaObject } from "openapi3-ts";
import { OpenApiTypeScriptConfig } from "./config";
import { TypeBase } from "./type-base";

export abstract class SchemaTypeBase extends TypeBase {
    public typeConfig: {
        generateMetadata?: boolean,
        generateSchemaFile?: boolean
    };
    constructor(
        id: string, 
        public readonly schema: SchemaObject,
        config: OpenApiTypeScriptConfig
    ){
        super(id);
        const defaultConfig = config.models?.default || {};
        const modelConfig = config?.models ? config.models[id] || {} : {};
        this.typeConfig = { ...defaultConfig, ...modelConfig };
    }

    getSchemaFilePath() {
        return this.getPath().replace('.ts', '.schema.ts');
    }

    writeSchemaFile() {
        let content = `export const ${this.name}_SCHEMA = ${JSON.stringify(this.schema, null, 4)};\n\n`;
        return content;
    }

}