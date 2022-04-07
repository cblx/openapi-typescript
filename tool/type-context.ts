import { SchemaObject } from 'openapi3-ts';
import { TypeBase } from './type-base.js';
import { BaseContext } from './base-context.js';
import { EOL } from 'os';
import { resolveImportPath } from './resolve-import-path.js';
import * as changeCase from 'change-case'
export class TypeContext {
    referencedTypes: TypeBase[] = [];
    constructor(private baseContext: BaseContext, private typeDefinition: TypeBase) { }
   
    loadReferenceIfRef(schema: SchemaObject){
        let ref = schema.$ref;
        if (schema.allOf) {
            ref = schema.allOf[0].$ref;
        }

        if (ref) {
            let id = ref.split('/').reverse()[0];
            let refTypeDefinition = this.baseContext.modelsAndEnums[id];

            // Avoid self referencing importing
            if (this.typeDefinition != refTypeDefinition) {
                if (!this.referencedTypes.includes(refTypeDefinition)) {
                    this.referencedTypes.push(refTypeDefinition);
                }
            }
            return refTypeDefinition;
        }
    }

    writeName(schema: SchemaObject) {
        if(!schema){ return 'any'; }
        let refTypeDefinition = this.loadReferenceIfRef(schema);
        if(refTypeDefinition){ return refTypeDefinition.name; }

        switch (schema.type) {
            case 'array': return `Array<${this.writeName(schema.items)}>`;
            case 'boolean': return 'boolean';
            case 'integer': return 'number';
            case 'number': return 'number';
            case 'string': return 'string';
            case 'object':
                let props = [];
                for (let p in schema.properties) {
                    props.push(this.writeProp(changeCase.camelCase(p), schema.properties[p]));
                }
                return `{ ${props.join(', ')} }`;
        }
        return 'any';
    }

    writeProp(propName: string, prop: SchemaObject){
        return `'${propName}': ${this.writeName(prop)} ${prop.nullable ? '| null' : ''}`;
    }

    writeImports() {
        let rows = this.referencedTypes.map(r => {
            const finalPath = resolveImportPath({
                fromDir: this.typeDefinition.dir,
                tsFile: r.getPath()
            });
            return `import { ${r.name} } from '${finalPath}';`;
        });
        let rowsText = rows.join(EOL);
        if(rowsText){ rowsText += EOL; }
        return rowsText;
    }
}