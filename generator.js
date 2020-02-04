const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const changeCase = require('change-case');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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
            if(action.path.startsWith('/')){
                 action.path = action.path.substring(1);
            }

            action.httpMethod = a;

            let functionName = `${a}${changeCase.pascalCase(action.path)}`;
            if (action.tags[1]) {
                functionName = changeCase.camelCase(action.tags[1]);
            }

            //Coloco a action dentro do client, como chave seria o nome final da função na classe de client
            clients[clientName].actions[functionName] = action;
        }
    }

    //Percorro os clients, criando seus arquivos
    for (let c in clients) {
        let fileName = `${changeCase.paramCase(c)}.client.ts`;
        let client = clients[c];

        let context = new ResolutionContext('client');

        let content = '';

        //content += `import { WebTypedInvoker } from '@guimabdo/webtyped-common';\n`;

        //Angular specific ///////////////////////
        //content += `import { Injectable } from '@angular/core';\n`;
        //content += `@Injectable({ providedIn: 'root', deps: [WebTypedInvoker] })\n`;
        //content += `@Injectable({ providedIn: 'root' })\n`;
        /////////////////////////////////////////

        if(events.beforeWriteServiceClass){
            content += events.beforeWriteServiceClass();
        }

        let connectorDecorator = '';
        if(events.createConnectorDecorator){
            connectorDecorator = events.createConnectorDecorator();
        }

        content += `export class ${c}Client {\n`;
        //content += `    private api = '${c.toLowerCase()}';\n`;
        content += `    constructor(${connectorDecorator}private connector: { request: (method: string, path: string, parameters: any, body: any) => Promise<any> }) {}\n`;
        for (let a in client.actions) {
            let action = client.actions[a];
            let returnType = 'void';

            let bodyRef = 'undefined';
            let parametersRef = 'undefined';

            let bodySignature = '';
            let parametersSignature = '';
            //let parametersRef = 'undefined';
            if ('parameters' in action) {
                parametersRef = 'parameters';
                parametersSignature += 'parameters: { ';
                let parameters = [];
                parameters = action.parameters;
                parametersSignature += parameters.map(p => (p.name.startsWith('$') ? p.name : changeCase.camelCase(p.name)) + '?: ' + context.resolve(p.schema)).join(', ');
                parametersSignature += ' }';
            }

            if ('requestBody' in action) {
                let content = action.requestBody.content['application/json'];
                if (!content) { continue; }

                bodyRef = 'body';
                let modelType = context.resolve(action.requestBody.content['application/json'].schema);
                bodySignature += `body: ${modelType}`;
            }

            if ('responses' in action && '200' in action.responses && 'content' in action.responses['200'] && 'application/json' in action.responses['200'].content) {
                let schema = action.responses['200'].content['application/json'].schema;
                returnType = context.resolve(schema);
            }

            let signatureParts = [];
            if(bodySignature){ signatureParts.push(bodySignature); }
            if(parametersSignature){ signatureParts.push(parametersSignature); }
            let signature = signatureParts.join(', ');


            content += `    ${a} = (${signature}) : Promise<${returnType}> => {\n`;


            content += `        return this.connector.request(\n`;
            content += `            '${action.httpMethod}',\n`;
            content += `            '${action.path}',\n`;
            content += `            ${parametersRef},\n`;
            content += `            ${bodyRef}\n`;
            content += `        );\n`;

            // content += `        return this.invoker.invoke(\n`;
            // //Esse primeiros parametros eram usados pelo webtyped para tipar o subscription de eventos. Vamos simplificar mandando qlquer coisa
            // content += `            {\n`;
            // content += `                returnTypeName: 'notNecessary',\n`;
            // content += `                kind: 'notNecessary',\n`;
            // content += `                func: <any>this.${a},\n`;
            // content += `                parameters: {},\n`;
            // content += `            },\n`;
            // //Caminho base da api (não precisa, vai estar tudo no path da action)
            // content += `            '',\n`;
            // //Caminho relativo da ação
            // content += `            '${action.path}',\n`;
            // //Metodo http utilizado
            // content += `            '${action.httpMethod}',\n`;
            // //Body
            // content += `            ${bodyRef},\n`;
            // //Query parameters
            // content += `            ${parametersRef},\n`;
            // //Retorno esperado, neste projeto usamos direto Promise,  no lugar de Observables
            // content += `            { name: 'Promise' }\n`;
            // content += `        );\n`;
            
            content += `    }\n`;
        }
        content += `}\n`;

        for (let i in context.imports) {
            content = i + content;
        }

        fs.writeFileSync(path.join(targetDir, fileName), content);
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
        let context = new ResolutionContext('model');
        let fileName = `${changeCase.paramCase(typeName)}.ts`;
        let content = '';
        let type = json.components.schemas[c];

        if ('enum' in type) {
            content += `export enum ${typeName} {\n`;
            content += `  ${type.enum.map(e => `_${e} = ${e}`).join(',\n  ')}\n`;
            content += '}';
        } else {
            //Crio a interface
            content += `export interface ${typeName} {\n`;
            for(let p in type.properties){
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
            for(let p in type.properties){
                content += `    static '$${p}' = '${p}';\n`;
            }
            content += `    static schema = schema;\n`;
            content += `}`;
        }


        for (let i in context.imports) {
            content = i + content;
        }

        fs.writeFileSync(path.join(modelDir, fileName), content);
    }
}

class ResolutionContext {
    constructor(scope){
        //this.path = path;
        this.imports = {};
        this.importsPath = '';
        if(scope == 'client'){
            this.importsPath = '/models';
        }
    }

    resolve(schema){
        if(schema.allOf){
            schema.$ref = schema.allOf[0].$ref;
        }
        
        if(schema.$ref){
            let typeName = schema.$ref.split('/').reverse()[0];

             //Alguns tipos array virão com [], quando dentro de generics
             typeName = typeName.replace('[]', 'Array');

            this.imports[`import { ${typeName} } from '.${this.importsPath}/${changeCase.paramCase(typeName)}';\n`] = true;
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
