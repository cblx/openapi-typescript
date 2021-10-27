import { SchemaObject, SchemasObject } from "openapi3-ts";
import { EOL } from "os";
import { OpenApiTypeScriptConfig } from "./config";
import { GenerateSchemaFileOptions } from "./generate-schema-file-options";
import { TypeBase } from "./type-base";

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

    writeSchemaFile(options: boolean | GenerateSchemaFileOptions, allSchemas: SchemasObject) {
        let content = `export const ${this.name}_SCHEMA = ${JSON.stringify(this.schema, null, 4)};${EOL}${EOL}`;
        if (typeof options === "object") {
            if (options.includeRefs) {
                content += this.writeSchemaRefs(allSchemas);
            }
        }
        return content;
    }



    private writeSchemaRefs(allSchemas: SchemasObject) {
        const refsSchemas: { [key: string]: SchemaObject } = {};
        (<any>refsSchemas)[this.id] = "####SELF_REF####";
        this.grabRefs(this.schema, allSchemas, refsSchemas);
        let content = `${EOL}export const ${this.name}_REFS = ${JSON.stringify(refsSchemas, null, 4)};${EOL}${EOL}`;
        content = content.replace('\"####SELF_REF####\"', `${this.id}_SCHEMA`);
        return content;
    }

    private grabRefs(schema: SchemaObject, allSchemas: SchemasObject, targetContainer: { [key: string]: SchemaObject }) {
        if (!schema.properties) { return; }
        for (const propName in schema.properties) {
            const prop = schema.properties[propName];
            let ref = prop.$ref;
            if ('allOf' in prop && prop.allOf) {
                ref = prop.allOf[0].$ref;
            }
            if(!ref){ continue; }
            let typeName = ref.split('/').reverse()[0];
            if(typeName in targetContainer){ continue; }
            if(!(typeName in allSchemas)){ continue; }
            targetContainer[typeName] = allSchemas[typeName];
            this.grabRefs(allSchemas[typeName], allSchemas, targetContainer);
        }
    }
}