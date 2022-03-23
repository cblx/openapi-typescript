import { SchemaTypeBase } from './schema-type-base.js';
import { TypeBase } from './type-base.js';
import { TypeContext } from './type-context.js';
export abstract class BaseContext {
    modelsAndEnums: { [key: string]: SchemaTypeBase; } = {};
    createTypeContext(file: TypeBase) {
        return new TypeContext(this, file);
    }
}