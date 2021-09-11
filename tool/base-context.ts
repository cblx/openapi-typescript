import { SchemaTypeBase } from './schema-type-base';
import { TypeBase } from './type-base';
import { TypeContext } from './type-context';

export abstract class BaseContext {
    modelsAndEnums: { [key: string]: SchemaTypeBase; } = {};
    createTypeContext(file: TypeBase) {
        return new TypeContext(this, file);
    }
}