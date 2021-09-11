import { SchemaObject } from 'openapi3-ts';
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
        content += `export interface ${this.name} {\n`;
        for (let p in schema.properties) {
            let prop = schema.properties[p] as SchemaObject;
            let propTypeName = context.writeName(prop);
            content += `    '${p}': ${propTypeName} ${prop.nullable ? '| null' : ''};\n`;
        }
        content += '}\n\n';

        if (this.typeConfig.generateMetadata === true) {
            content += this.writeMetadata();
        }

        content = context.writeImports() + content;

        return content;
    }

    private writeMetadata() {
        const schema = this.schema;
        let content = `const schema = ${JSON.stringify(schema, null, 4)};\n\n`;

        //Crio um tipo fisico para referenciarmos names
        content += `export class ${this.name} {\n`;
        content += `    static '$' = '${this.name}';\n`;

        //Importante manter o $ aqui, uma vez que nomes de campos
        //podem conflitar com coisas nativas do javascript.
        //Por exemplo, o campo 'name' conflitaria com Function.name,
        //que está em toda classe.
        for (let p in schema.properties) {
            content += `    static '$${p}' = '${p}';\n`;
        }
        content += `    static schema = schema;\n`;
        content += `}`;
        return content;
    }
}

