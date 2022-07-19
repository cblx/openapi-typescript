import { PathItemObject } from 'openapi3-ts';
import { TypeBase } from "./type-base.js";
import * as changeCase from 'change-case'
import { BaseContext } from './base-context.js';
import { ClientMethod } from './client-method.js';
import { ClientConfig, OpenApiTypeScriptConfig } from './config.js';
import { ClientMethodOld } from './client-method-old.js';
import { EOL } from 'os';
export class ClientType extends TypeBase {
    ctor = 'constructor(private connector: OpenApiConnector) {}';
    importsSection = [];
    decoratorsSection = [];
    fieldsSection = [];
    methods: (ClientMethod | ClientMethodOld)[] = [];
    private clientConfig: ClientConfig;
    constructor(
        id: string, 
        private pathItems: { [name: string]: PathItemObject }, 
        private baseContext: BaseContext,
        private config: OpenApiTypeScriptConfig
    ){
        super(id);
        this.clientConfig = config.clients?.[id] ?? config?.clients?.['default'] ?? {};
        let name = this.name;
        this.fileName = `${changeCase.paramCase(this.name)}.client.ts`;
        this.name = `${this.name}Client`;
        if(this.clientConfig.interceptor){
            let context = {
                name,
                className: this.name,
                fileName: this.fileName
            };
            this.clientConfig.interceptor(context);
            this.fileName = context.fileName;
            this.name = context.className;
        }
        this.init();
    }

    private init(){
        const Method = this.resolveClientMethodType();
        for (let a in this.pathItems) {
            const method = new Method(a, this.pathItems[a]);
            this.methods.push(method);
        }
    }

    private resolveClientMethodType(){
        if(!this.config.clients) { return ClientMethod; }
        const specificConfig = this.config.clients[this.id];
        if(specificConfig?.oldMode === true){ return ClientMethodOld; }
        if(specificConfig?.oldMode === false){ return ClientMethod; }
        const defaultConfig = this.config.clients.default;
        if(defaultConfig?.oldMode === true){ return ClientMethodOld; }
        return ClientMethod;
    }

    write() {
        let context = this.baseContext.createTypeContext(this);
        const writingClient = this.config?.hooks?.writingClient;
        writingClient && writingClient(this, context);

        let content = '';
        let needToImportDeleteUndefineds = this.methods.some(m => m.hasQueryParameters);
        content += `import { OpenApiConnector${needToImportDeleteUndefineds ? ', deleteUndefineds' : ''} } from '@cblx-br/openapi-typescript';`;


        let spacing = '    ';
        content += EOL;
        this.importsSection.forEach(str => content += `${str}${EOL}`);
        content += EOL;
        content += EOL;
        this.decoratorsSection.forEach(str => content += `${str}${EOL}`);
        content += EOL;

        // Open class
        content += `export class ${this.name} {${EOL}`;

        this.fieldsSection.forEach(str => content += `${spacing}${str}${EOL}`);
        content += EOL;
        content += `${spacing}${this.ctor}${EOL}${EOL}`;

        this.methods.forEach(method => content += method.write(spacing, this.config, context) + EOL);

        // Close class
        content += `}`;

        // Inject imports
        content = context.writeImports() + content;

        return content;
    }
}