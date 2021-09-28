import { SchemaObject } from 'openapi3-ts';
import * as path from 'path';
import { TypeBase } from './type-base';
import { BaseContext } from './base-context';


export class TypeContext {
    private referencedTypes: TypeBase[] = [];
    constructor(private baseContext: BaseContext, private typeDefinition: TypeBase) { }

    writeName(schema: SchemaObject) {
        if(!schema){ return 'any'; }
        if (schema.allOf) {
            schema.$ref = schema.allOf[0].$ref;
        }

        if (schema.$ref) {
            let id = schema.$ref.split('/').reverse()[0];
            let refTypeDefinition = this.baseContext.modelsAndEnums[id];

            // Avoid self referencing importing
            if (this.typeDefinition != refTypeDefinition) {
                if (this.referencedTypes.indexOf(refTypeDefinition) < 0) {
                    this.referencedTypes.push(refTypeDefinition);
                }
            }
            return refTypeDefinition.name;
        }

        switch (schema.type) {
            case 'array': return `Array<${this.writeName(schema.items)}>`;
            case 'boolean': return 'boolean';
            case 'integer': return 'number';
            case 'number': return 'number';
            case 'string': return 'string';
        }
        return 'any';
    }

    writeImports() {
        let rows = this.referencedTypes.map(r => {
            let relativePath = path.relative(this.typeDefinition.dir, r.dir).replace('\\', '/');
            if(relativePath[0] != '.'){
                if(relativePath[0] != '/'){
                    relativePath = '/' + relativePath;    
                }
                relativePath = '.' + relativePath;
            }
            let fileName = r.fileName.replace('.ts', '');
            const finalPath = (relativePath + '/' + fileName).replace('.//', './');
            return `import { ${r.name} } from '${finalPath}';`;
        });
        let rowsText = rows.join('\n');
        if(rowsText){ rowsText += '\n'; }
        return rowsText;
    }
}
