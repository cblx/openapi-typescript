import { SchemaObject } from 'openapi3-ts';
import { TypeBase } from './type-base';
import { BaseContext } from './base-context';

export class ModelType extends TypeBase {
    constructor(public readonly id: string, public readonly schema: SchemaObject, private baseContext: BaseContext){
        super(id);
    }
    write() {
        let context = this.baseContext.createTypeContext(this);
        let content = '';
        let schema = this.schema;
        //definition = new InterfaceDefinition();
        //Crio a interface
        content += `export interface ${this.name} {\n`;
        for (let p in schema.properties) {
            let prop = schema.properties[p];
            let propTypeName = context.writeName(prop);
            content += `    '${p}'${schema.nullable ? '?' : ''}: ${propTypeName};\n`;
        }
        content += '}\n\n';

        content += `const schema = ${JSON.stringify(schema, null, 4)};\n\n`

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

        content = context.writeImports() + content;

        return content;
    }
}

