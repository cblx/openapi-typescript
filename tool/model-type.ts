import { SchemaObject } from 'openapi3-ts';
import { EOL } from 'os';
import { BaseContext } from './base-context.js';
import { OpenApiTypeScriptConfig } from './config.js';
import { EnumType } from './enum-type.js';
import { GenerateSchemaFileOptions } from './generate-schema-file-options.js';
import { resolveImportPath } from './resolve-import-path.js';
import { SchemaTypeBase } from './schema-type-base.js';

export class ModelType extends SchemaTypeBase {
    constructor(
        public readonly id: string,
        schema: SchemaObject,
        private baseContext: BaseContext,
        config: OpenApiTypeScriptConfig) {
        super(id, schema, config);
    }

    getReferencedTypes() {
        let context = this.baseContext.createTypeContext(this);
        let schema = this.schema;
        for (let p in schema.properties) {
            let prop = schema.properties[p] as SchemaObject;
            context.loadReferenceIfRef(prop);
        }
        return context.referencedTypes;
    }

    write() {
        let context = this.baseContext.createTypeContext(this);
        let content = '';
        let schema = this.schema;
        content += `export interface ${this.name} {${EOL}`;
        for (let p in schema.properties) {
            let prop = schema.properties[p] as SchemaObject;
            let propTypeName = context.writeName(prop);
            content += `    '${p}': ${propTypeName} ${prop.nullable ? '| null' : ''};${EOL}`;
        }
        content += `}${EOL}${EOL}`;

        if (this.typeConfig.generateMetadata === true) {
            content += this.writeMetadata();
        }

        content = context.writeImports() + content;

        return content;
    }

    private writeMetadata() {
        const schema = this.schema;
        let content = `const schema = ${JSON.stringify(schema, null, 4)};${EOL}${EOL}`;

        content += `export class ${this.name} {${EOL}`;
        content += `    static '$' = '${this.name}';${EOL}`;

        for (let p in schema.properties) {
            content += `    static '$${p}' = '${p}';${EOL}`;
        }
        content += `    static schema = schema;${EOL}`;
        content += `}`;
        return content;
    }

    writeSchemaFile(options: boolean | GenerateSchemaFileOptions) {
        let content = `export const ${this.name}_SCHEMA = ${JSON.stringify(this.schema, null, 4)};${EOL}${EOL}`;
        if (typeof options === "object") {
            if (options.includeRefs) {
                let context = this.baseContext.createTypeContext(this);
                let schema = this.schema;
                for (let p in schema.properties) {
                    let prop = schema.properties[p] as SchemaObject;
                    context.loadReferenceIfRef(prop);
                }

                let rows = context.referencedTypes.map((r: SchemaTypeBase) => {
                    const finalPath = resolveImportPath({
                        fromDir: this.dir,
                        tsFile: r.getSchemaFilePath()
                    });
                    return `import { ${r.name}_SCHEMA } from '${finalPath}';`;
                });
                let importedSchemasText = rows.join(EOL);
                if(importedSchemasText){ importedSchemasText += EOL; }
                content = importedSchemasText + content;
             
                let refsText = `${EOL}export const ${this.name}_REFS = {`;
                const refs = [this,...context.referencedTypes];
                refs.forEach((ref, index) => {
                    refsText += `${EOL}    '${ref['id']}': ${ref.name}_SCHEMA${index < refs.length -1 ? ',' : ''}`;    
                });
                refsText += '}';
                content += refsText;
            }
        }
        return content;
    }
}