import { PathItemObject } from 'openapi3-ts';
import { TypeBase } from "./type-base";
import * as changeCase from 'change-case'
import { BaseContext } from './base-context';
import { ClientMethod } from './client-method';
import { OpenApiTypeScriptConfig } from './config';

export class ClientType extends TypeBase {
    ctor = 'constructor(private connector: OpenApiConnector) {}';
    importsSection = [];
    decoratorsSection = [];
    fieldsSection = [];
    methods: ClientMethod[] = [];

    constructor(
        id: string, 
        private pathItems: { [name: string]: PathItemObject }, 
        private baseContext: BaseContext,
        private config: OpenApiTypeScriptConfig
    ){
        super(id);
        this.fileName = `${changeCase.paramCase(this.name)}.client.ts`;
        this.name = `${this.name}Client`;
        this.init();
    }

    private init(){
        for (let a in this.pathItems) {
            const method = new ClientMethod(a, this.pathItems[a]);
            this.methods.push(method);
        }
    }

    write() {
        let context = this.baseContext.createTypeContext(this);
        const writingClient = this.config?.events?.writingClient;
        writingClient && writingClient(this, context);

        let content = '';
        let needToImportDeleteUndefineds = this.methods.some(m => m.hasQueryParameters);
        content += `import { OpenApiConnector${needToImportDeleteUndefineds ? ', deleteUndefineds' : ''} } from '@cblx-br/openapi-typescript';`;


        let spacing = '    ';
        content += '\n';
        this.importsSection.forEach(str => content += `${str}\n`);
        content += '\n';
        content += '\n';
        this.decoratorsSection.forEach(str => content += `${str}\n`);
        content += '\n';

        // Open class
        content += `export class ${this.name} {\n`;

        this.fieldsSection.forEach(str => content += `${spacing}${str}\n`);
        content += '\n';
        content += `${spacing}${this.ctor}\n\n`;

        this.methods.forEach(method => content += method.write(spacing, this.config, context) + '\n');

        // Close class
        content += `}`;

        // Inject imports
        content = context.writeImports() + content;

        return content;
    }
}
