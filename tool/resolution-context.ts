import * as changeCase from 'change-case';

export class ResolutionContext {
    imports: { [key: string]: boolean; } = {};
    importsPath = '';
    typeName: string;
    constructor(scope: string, typeName: string) {
        this.typeName = typeName;
        //this.path = path;
        if (scope == 'client') {
            this.importsPath = '/models';
        }
    }

    resolve(schema) {
        let ref = schema.$ref;
        if (schema.allOf) {
            ref = schema.allOf[0].$ref;
        }

        if (ref) {
            let typeName = ref.split('/').reverse()[0];

            // Avoid self referencing importing
            if (this.typeName != typeName) {

                //Alguns tipos array virão com [], quando dentro de generics
                typeName = typeName.replace('[]', 'Array');

                this.imports[`import { ${typeName} } from '.${this.importsPath}/${changeCase.paramCase(typeName)}';\n`] = true;
            }
            return typeName;
        }

        switch (schema.type) {
            case 'array': return `Array<${this.resolve(schema.items)}>`;
            case 'boolean': return 'boolean';
            case 'integer': return 'number';
            case 'number': return 'number';
            case 'string': return 'string';
        }
        return 'any';
    }
}
