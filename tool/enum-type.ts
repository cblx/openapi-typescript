import { SchemaObject } from 'openapi3-ts';
import { EOL } from 'os';
import { OpenApiTypeScriptConfig } from './config';
import { SchemaTypeBase } from './schema-type-base';

export class EnumType extends SchemaTypeBase {
    constructor(
        public readonly id: string, 
        schema: SchemaObject,
        config: OpenApiTypeScriptConfig) {
        super(id, schema, config);
    }

    write() {
        let content = '';
        let schema = this.schema;
        content += `export enum ${this.name} {${EOL}`;
        const names = schema['x-enum-varnames'] || schema.enum.map(e => this.writeEnumNameFromValue(e));
        content += `  ${schema.enum.map((e, i) => `${names[i]} = ${this.writeEnumValue(e)}`).join(`,${EOL}  `)}${EOL}`;
        content += '}';
        return content;
    }

    private writeEnumNameFromValue(value: any) {
        if(this.isNumeric(value)){ return `_${value}`; }
        return value;
    }

    private isNumeric(str: any) {
        return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
            !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
    }

    private writeEnumValue(value: any) {
        if (typeof value === 'number') {
            return value;
        }
        return `'${value}'`;
    }
}
