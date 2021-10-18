import { SchemaObject } from 'openapi3-ts';
import { EOL } from 'os';
import { BaseContext } from './base-context';
import { OpenApiTypeScriptConfig } from './config';
import { SchemaTypeBase } from './schema-type-base';

export class ModelType extends SchemaTypeBase {
    constructor(
        public readonly id: string,
        schema: SchemaObject,
        private baseContext: BaseContext,
        config: OpenApiTypeScriptConfig) {
        super(id, schema, config);
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
}

