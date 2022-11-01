import { ComponentsObject, SchemaObject } from 'openapi3-ts';
import { EnumType } from '../../enum-type';
import { SolutionContext } from '../../main-context';
import { ModelType } from '../../model-type';
import { SchemaTypeBase } from '../../schema-type-base';
import { TypeContext } from '../../type-context';
const tab = '    ';
export function writeAngularFormCreator(type: SchemaTypeBase, components: ComponentsObject, context: SolutionContext) {
    if (type.schema.enum) { 
        return createEnumOptionsFile(<EnumType>type);
    }
    const customFiles: { [path: string]: string } = {};
    const model = <ModelType>type;
    const path = model.getPath().replace('.ts', '.form.ts');
    const modelContext = context.createTypeContext(model);
    let content = `import { FormGroup, FormControl, Validators } from '@angular/forms';
export function create${model.name}Form(){
    const formGroup = new FormGroup({
        ${writeProps(model, components, modelContext)}
    });
    return formGroup;
}
    `;
    let imports = modelContext.writeImports();
    imports += imports
                .replace(/';/g, ".options';")
                .replace(/ }/g,"Options }");
    content = imports + content;
    // Remove o import do Validators caso não tenha sido usado
    if(!content.includes('Validators.')){ 
        content = content.replace(', Validators', ''); 
    }
    customFiles[path] = content;
    return customFiles;
}

function createEnumOptionsFile(enType: EnumType){
    const customFiles: { [path: string]: string } = {};
    const path = enType.getPath().replace('.ts', '.options.ts');
    const schema = enType.schema;
    const options: string[] = [];
    for(let enumIndex = 0; enumIndex < schema.enum.length; enumIndex++){
        options.push(`{ value:${schema.enum[enumIndex]} , text: '${schema['x-enum-pt'][enumIndex]}' }`);
    }
    let content = `export const ${enType.name}Options = [
    ${options.join(`,\n${tab}`)}
];`;
    
    customFiles[path] = content;
    return customFiles;
}

function writeProps(model: SchemaTypeBase, components: ComponentsObject, modelContext: TypeContext) {
    const props = [];
    for (let prop in model.schema.properties) {
        const validators = writeValidators(model, prop);
        const schema = (<SchemaObject>model.schema.properties[prop]);
        let defaultValue = model.schema.default;
        let type: string | undefined = schema.type;
        let withOptions = '';
        if('allOf' in schema){
            let refName = schema.allOf[0].$ref;
            refName = refName.split('/').reverse()[0];
            let refSchema = components.schemas[refName];
            if('enum' in refSchema && refSchema.enum){
                type = modelContext.writeName(schema);
                withOptions = `.withOptions(${type}Options)`;
                
            }
        }
        let withMaxLength = ''
        if(schema.maxLength){
            withMaxLength = `.withMaxLength(${schema.maxLength})`;
        }
        if(schema.maximum){
            withMaxLength = `.withMaximum(${schema.maximum})`;
        }
        if(schema.minimum){
            withMaxLength = `.withMinimum(${schema.minimum})`;
        }

        type = type ?? 'object';
        if(type == 'array'){ type = 'any[]'; }
        if(type == 'integer'){ type = 'number'; }
        type += ' | null';
        defaultValue = defaultValue === undefined ? 'null' : JSON.stringify(defaultValue);
        props.push(
            `${prop}: new FormControl<${type}>(${defaultValue}, [${validators}]).withName('${prop}')${withOptions}${withMaxLength}`
        )
    }
    return props.join(',\n\t\t');
}

function writeValidators(model: SchemaTypeBase, prop: string) {
    const validators = [];
    const schema: SchemaObject = model.schema.properties[prop];
    if (model.schema.required?.includes(prop)) { validators.push('Validators.required'); }
    if (schema.maximum || schema.maximum === 0) {
        validators.push(`Validators.max(${schema.maximum})`);
        if (schema.exclusiveMaximum) {
            validators.push(`ctrl => ctrl.value == ${schema.maximum} ? { exclusiveMax: { max: ${schema.maximum} } } : null`);
        }
    }

    if (schema.maxLength) {
        validators.push(`Validators.maxLength(${schema.maxLength})`);
    }

    if (schema.minimum || schema.minimum === 0) {
        validators.push(`Validators.min(${schema.minimum})`);
        if (schema.exclusiveMinimum) {
            validators.push(`ctrl => ctrl.value == ${schema.minimum} ? { exclusiveMin: { min: ${schema.minimum} } } : null`);
        }
    }

    if (schema.minLength) {
        validators.push(`Validators.minLength(${schema.minLength})`);
    }

    if (schema.pattern) {
        validators.push(`Validators.pattern(/${schema.pattern}/)`);
    }

    if (schema.format == 'email') {
        validators.push(`Validators.email`);
    }

    // if it has more than one validator, break one line at the beginning
    let source = validators.join(',\n\t\t\t');
    if (validators.length > 1) {
        source = '\n\t\t\t' + source;
        source += '\n\t\t';
    }
    return source;
}
