import { SchemaObject } from 'openapi3-ts';
import { TypeBase } from './type-base';

export class EnumType extends TypeBase {
    constructor(public readonly id: string, public readonly schema: SchemaObject){
        super(id);
    }

    write(){
        let content = '';
        let schema = this.schema;
        content += `export enum ${this.name} {\n`;
        const names = schema['x-enum-varnames'] || schema.enum.map(e => `_${e}`);
        content += `  ${schema.enum.map((e, i) => `${names[i]} = ${e}`).join(',\n  ')}\n`;
        content += '}';
        return content;
    }
}
