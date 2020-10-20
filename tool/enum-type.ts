import { SchemaObject } from 'openapi3-ts';
import { TypeBase } from './type-base';

export class EnumType extends TypeBase {
    constructor(public readonly id: string, public readonly schema: SchemaObject) {
        super(id);
    }

    write() {
        let content = '';
        let schema = this.schema;
        content += `export enum ${this.name} {\n`;
        const names = schema['x-enum-varnames'] || schema.enum.map(e => this.writeEnumNameFromValue(e));
        content += `  ${schema.enum.map((e, i) => `${names[i]} = ${this.writeEnumValue(e)}`).join(',\n  ')}\n`;
        content += '}';
        return content;
    }

    private writeEnumNameFromValue(value: any) {
        if(this.isNumeric(name)){ return `_${name}`; }
        return name;
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
