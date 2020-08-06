const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const changeCase = require('change-case');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class ClassDefinition {
    constructor() {
        this.name = '';
        this.constructor = '';
        this.importsSection = [];
        this.decoratorsSection = [];
        this.fieldsSection = [];
        this.methods = [];
    }

    toString() {
        let content = '';
        let spacing = '    ';
        this.importsSection.forEach(str => content += `${str}\n`);
        content += '\n';
        content += '\n';
        this.decoratorsSection.forEach(str => content += `${str}\n`);
        content += '\n';

        // Open class
        content += `export class ${this.name} {\n`;

        this.fieldsSection.forEach(str => content += `${spacing}${str}\n`);
        content += '\n';
        content += `${spacing}${this.constructor}\n\n`
        
        this.methods.forEach(method => content += method.toString(spacing) + '\n');

        // Close class
        content += `}`;
        return content;
    }
};

class MethodDefinition {
    constructor() {
        this.async = false;
        this.name = '';
        this.parameters = '';
        this.returnType = '';
        this.body = '';
    }

    toString(spacing){
        let content = '';

        //content += `${spacing}${this.name} = (${this.parameters}) : ${this.returnType} => {\n`;
        content += spacing;
        if(this.async){
            content += 'async ';
        }
        let returnType = this.returnType;
        if(this.async){
            returnType = `Promise<${returnType}>`;
        }
        content += `${this.name}(${this.parameters}) : ${returnType} {\n`;
        content += spacing;
        content += spacing;
        content += this.body.split('\n').join(`\n${spacing}${spacing}`);
        content += '\n';
        content += `${spacing}}\n`;
        return content;
    }
}

async function execute(config) {
    let defEndpoint = config.url;
    let targetDir = config.outputDir;
    let events = config.events || {};

    let response = await fetch(defEndpoint);
    let json = await response.json();

    deleteFolderRecursive(targetDir);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
    }

    let clients = {};

    fs.writeFileSync(path.join(targetDir, 'definition.ts'), `export const openApiDefinition = ${JSON.stringify(json, null, 2)};`);

    //Entre os paths
    for (let p in json.paths) {

        //Pego as actions
        let actions = json.paths[p];

        //Para cada action
        for (let a in actions) {
            //Verifico o nome do client, que seria o primeiro item em "tags"
            let action = actions[a];
            let clientName = action.tags[0];
            //Controllers genéricos trarão ` no nome
            clientName = clientName.replace('`', '');

            //Crio o registro de client se não houver
            if (!(clientName in clients)) {
                clients[clientName] = {
                    actions: {}
                };
            }

            //Crio o caminho relativo do endpoint
            //Determino o path relativo
            // action.path = p.replace(`/${clientName}`, '');

            action.path = p;
            if (action.path.startsWith('/')) {
                action.path = action.path.substring(1);
            }

            action.httpMethod = a;

            // Fallback function name
            let functionName = `${a}${changeCase.pascalCase(action.path)}`;

            // Remove this support. "operationId" should be the only valid option for setting function name
            if (action.tags[1]) {
                functionName = changeCase.camelCase(action.tags[1]);
            }

            // Function name from operationId
            if (action.operationId) {
                functionName = changeCase.camelCase(action.operationId);
            }

            //Coloco a action dentro do client, como chave seria o nome final da função na classe de client
            clients[clientName].actions[functionName] = action;
        }
    }

    const allRelativeFiles = [];

    //const serviceClasses = [];
    //Percorro os clients, criando seus arquivos
    for (let c in clients) {
        let serviceClass = new ClassDefinition();
        let fileName = `${changeCase.paramCase(c)}.client.ts`;
        let client = clients[c];

        let context = new ResolutionContext('client');

        //let content = '';

        //content += `import { OpenApiConnector, deleteUndefineds } from '@cblx-br/openapi-typescript';\n`;
        serviceClass.importsSection.push(`import { OpenApiConnector, deleteUndefineds } from '@cblx-br/openapi-typescript';`);

        // if (events.beforeWriteServiceClass) {
        //     content += events.beforeWriteServiceClass();
        // }

        // let connectorDecorator = '';
        // if (events.createConnectorDecorator) {
        //     connectorDecorator = events.createConnectorDecorator();
        // }

        serviceClass.name = `${c}Client`;
        //content += `export class ${c}Client {\n`;
        //content += `    private api = '${c.toLowerCase()}';\n`;
        //content += `    constructor(${connectorDecorator}private connector: OpenApiConnector) {}\n`;
        serviceClass.constructor = `constructor(private connector: OpenApiConnector) {}`;
        for (let a in client.actions) {
            let action = client.actions[a];
            let path = action.path;
            let returnType = 'void';

            let bodyRef = 'undefined';
            let parametersRef = 'undefined';

            let bodySignature = '';
            let parametersSignature = '';

            function getParamName(name) {
                return name.startsWith('$') ? name : changeCase.camelCase(name);
            }

            //let parametersRef = 'undefined';
            if ('parameters' in action) {
                //parametersRef = 'parameters';
                parametersSignature += 'parameters: { ';
                let parameters = [];
                parameters = action.parameters;
                //parametersSignature += parameters.map(p => getParamName(p.name) + '?: ' + context.resolve(p.schema)).join(', ');
                parametersSignature += parameters.map(p => getParamName(p.name) + (p.required ? '': '?') + ': ' + context.resolve(p.schema)).join(', ');
                parametersSignature += ' }';

                let queryParameters = parameters.filter(p => p.in == 'query');
                if (queryParameters.length) {
                    parametersRef = 'deleteUndefineds({ ';
                    parametersRef += queryParameters.map(p => `${getParamName(p.name)}: parameters.${getParamName(p.name)}`).join(', ');
                    parametersRef += ' })';
                }

                let pathParameters = parameters.filter(p => p.in == 'path');
                for (let p of pathParameters) {
                    path = path.replace(`{${p.name}}`, `$\{parameters.${p.name}\}`);
                }
            }

            if ('requestBody' in action) {
                let requestBodyContent = action.requestBody.content['application/json'];
                if (!requestBodyContent) { continue; }

                bodyRef = 'body';
                let modelType = context.resolve(requestBodyContent.schema);
                bodySignature += `body: ${modelType}`;
            }

            if ('responses' in action && '200' in action.responses && 'content' in action.responses['200'] && 'application/json' in action.responses['200'].content) {
                let schema = action.responses['200'].content['application/json'].schema;
                returnType = context.resolve(schema);
            }

            let signatureParts = [];

            if (parametersSignature) { signatureParts.push(parametersSignature); }
            if (bodySignature) { signatureParts.push(bodySignature); }

            let signature = signatureParts.join(', ');

            const method = new MethodDefinition();
            method.async = true;
            method.name = a;
            //method.returnType = `Promise<${returnType}>`;
            method.returnType = returnType;
            method.parameters = signature;
            //method.signature = `${a} = (${signature}) : Promise<${returnType}>`;
            method.body += `return this.connector.request(\n`;
            method.body += `    '${action.httpMethod}',\n`;
            method.body += `    \`${path}\`,\n`;
            method.body += `    ${parametersRef},\n`;
            method.body += `    ${bodyRef}\n`;
            method.body += `);\n`;
            serviceClass.methods.push(method);

            // content += `    ${a} = (${signature}) : Promise<${returnType}> => {\n`;


            // content += `        return this.connector.request(\n`;
            // content += `            '${action.httpMethod}',\n`;
            // content += `            \`${path}\`,\n`;
            // content += `            ${parametersRef},\n`;
            // content += `            ${bodyRef}\n`;
            // content += `        );\n`;

            // content += `    }\n`;
        }
        //content += `}\n`;

        for (let i in context.imports) {
            //content = i + content;
            serviceClass.importsSection.push(i);
        }

        if (events.interceptServiceClass) {
            events.interceptServiceClass(serviceClass);
        }

        const content = serviceClass.toString();

        let filePath = path.join(targetDir, fileName);
        fs.writeFileSync(filePath, content);
        allRelativeFiles.push('./' + fileName);
    }


    //Criar as models
    let modelDir = path.join(targetDir, 'models');
    if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir);
    }

    for (let c in json.components.schemas) {
        //Alguns tipos array virão com [], quando dentro de generics
        let typeName = c.replace('[]', 'Array');

        //let imports = {};
        let context = new ResolutionContext('model', typeName);
        let fileName = `${changeCase.paramCase(typeName)}.ts`;
        let content = '';
        let type = json.components.schemas[c];

        if ('enum' in type) {
            content += `export enum ${typeName} {\n`;
            const names = type['x-enum-varnames'] || type.enum.map(e => `_${e}`);
            content += `  ${type.enum.map((e, i) => `${names[i]} = ${e}`).join(',\n  ')}\n`;
            content += '}';
        } else {
            //Crio a interface
            content += `export interface ${typeName} {\n`;
            for (let p in type.properties) {
                let prop = type.properties[p];
                let propTypeName = context.resolve(prop);
                content += `    '${p}'${prop.nullable ? '?' : ''}: ${propTypeName};\n`;
            }
            content += '}\n\n';

            content += `const schema = ${JSON.stringify(type, null, 4)};\n\n`

            //Crio um tipo fisico para referenciarmos names
            content += `export class ${typeName} {\n`;
            content += `    static '$' = '${typeName}';\n`;

            //Importante manter o $ aqui, uma vez que nomes de campos
            //podem conflitar com coisas nativas do javascript.
            //Por exemplo, o campo 'name' conflitaria com Function.name,
            //que está em toda classe.
            for (let p in type.properties) {
                content += `    static '$${p}' = '${p}';\n`;
            }
            content += `    static schema = schema;\n`;
            content += `}`;
        }


        for (let i in context.imports) {
            content = i + content;
        }

        let filePath = path.join(modelDir, fileName);
        fs.writeFileSync(filePath, content);
        allRelativeFiles.push('./models/' + fileName);
    }

    let indexContent = '';
    for (let filePath of allRelativeFiles) {
        indexContent += `export * from '${filePath.replace('.ts', '').replace(/\\/g, '/')}';\n`;
    }
    fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);
}

class ResolutionContext {
    constructor(scope, typeName) {
        //this.path = path;
        this.imports = {};
        this.importsPath = '';
        this.typeName = typeName;
        if (scope == 'client') {
            this.importsPath = '/models';
        }
    }

    resolve(schema) {
        if (schema.allOf) {
            schema.$ref = schema.allOf[0].$ref;
        }

        if (schema.$ref) {
            let typeName = schema.$ref.split('/').reverse()[0];

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

const deleteFolderRecursive = function (dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file, index) => {
            const curPath = path.join(dir, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
    }
};

module.exports = execute;
