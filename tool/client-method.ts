import { ParameterObject, PathItemObject, SchemaObject } from 'openapi3-ts';
import { TypeContext } from "./type-context.js";
import * as changeCase from 'change-case'
import { OpenApiTypeScriptConfig } from './config.js';
import { EOL } from 'os';
export class ClientMethod {
    name = '';
    private queryAndPathParameters: ParameterObject[] = [];
    private bodyParameter: SchemaObject = null;
    private formDataParameter: SchemaObject = null;
    private returnType: SchemaObject = null;
    private preBodyLines: string[] = [];
    private path: string;

    // To know if we need to import 'deleteUndefineds'
    get hasQueryParameters() {
        return this.queryAndPathParameters && this.queryAndPathParameters.some(x => x.in == 'query');
    }

    get hasUrlParameters() {
        return this.queryAndPathParameters && this.queryAndPathParameters.length > 0;
    }

    get hasBodyParameters() {
        return this.bodyParameter != null;
    }

    constructor(
        id: string, 
        private pathItem: PathItemObject
    ) {
        this.name = id;

        this.path = pathItem.path;
        let searchPart = 'const search = undefined;';
        if ('parameters' in pathItem) {
            this.queryAndPathParameters = <ParameterObject[]>pathItem.parameters;
            const parameters = pathItem.parameters;
            let queryParameters = <ParameterObject[]>parameters.filter((p: ParameterObject) => p.in == 'query');
            if (queryParameters.length) {
                searchPart = 'const search = deleteUndefineds({ ';
                searchPart += queryParameters.map(p => `${this.getParamName(p.name)}: parameters.query.${this.getParamName(p.name)}`).join(', ');
                searchPart += ' })';
            }

            let pathParameters = <ParameterObject[]>parameters.filter((p: ParameterObject) => p.in == 'path');
            for (let p of pathParameters) {
                this.path = this.path.replace(`{${p.name}}`, `$\{parameters.path.${this.getParamName(p.name)}\}`);
            }
        }
        this.preBodyLines.push(searchPart);


        if ('requestBody' in pathItem) {
            let requestBodyContent = (pathItem.requestBody?.content ?? {})['application/json'];
            if (requestBodyContent) {
                this.bodyParameter = requestBodyContent.schema;
            }
            requestBodyContent = (pathItem.requestBody?.content ?? {})['multipart/form-data'];
            if (requestBodyContent) {
                this.formDataParameter = requestBodyContent.schema;
                this.preBodyLines.push('if(parameters.formValues) { for(const prop in parameters.formValues){ parameters.formData.append(prop, (<any>parameters.formValues)[prop]); } }');
            }
        }

        if ('responses' in pathItem && '200' in pathItem.responses && 'content' in pathItem.responses['200'] && 'application/json' in pathItem.responses['200'].content) {
            let schema = pathItem.responses['200'].content['application/json'].schema;
            this.returnType = schema;
        }


    }

    private getParamName(name: string) {
        return name.startsWith('$') ? name : changeCase.camelCase(name);
    }


    writeParameters(context: TypeContext, spacing: string = '') {
        const pathParameters = this.queryAndPathParameters?.filter(p => p.in == 'path') || [];
        const queryParameters = this.queryAndPathParameters?.filter(p => p.in == 'query') || [];
        if (!queryParameters.length 
            && !pathParameters.length 
            && !this.bodyParameter 
            && !this.formDataParameter) { return 'extra?: any'; }

        let parametersText = `parameters: {${EOL}`;

        let parts: string[] = [];
        if (pathParameters.length) {
            parts.push(`${spacing}${spacing}path: ${this.writeUrlParameters(context, pathParameters)}`);
        }
        if (queryParameters.length) {
            parts.push(`${spacing}${spacing}query: ${this.writeUrlParameters(context, queryParameters)}`);
        }
        if (this.bodyParameter) {
            parts.push(`${spacing}${spacing}body: ${context.writeName(this.bodyParameter)}`);
        }else if(this.formDataParameter){
            parts.push(`${spacing}${spacing}formData: FormData`);
            parts.push(`${spacing}${spacing}formValues?: ${context.writeName(this.formDataParameter)}`);
        }

        parametersText += parts.join(`,${EOL}`);
        parametersText += `${EOL}${spacing}}, extra?: any`;

        return parametersText;
    }

    private writeUrlParameters(context: TypeContext, parameters: ParameterObject[]) {
        let sgn = '{ ';
        sgn += parameters.map((p: ParameterObject) => this.getParamName(p.name) + (p.required ? '' : '?') + ': ' + context.writeName(p.schema)).join(', ');
        sgn += ' }';
        return sgn;
    }

    writeReturnType(context: TypeContext) {
        return `Promise<${context.writeName(this.returnType)}>`;
    }

    write(spacing: string, config: OpenApiTypeScriptConfig, context: TypeContext) {
        let bodyRequest = '';
        bodyRequest += `const promise = this.connector.request(${EOL}`;
        bodyRequest += `    '${this.pathItem.httpMethod}',${EOL}`;
        bodyRequest += `    \`${this.path}\`,${EOL}`;
        bodyRequest += `    search,${EOL}`;
        if (this.bodyParameter) {
            bodyRequest += `    parameters.body`;
        }
        else if(this.formDataParameter){
            bodyRequest += `    parameters.formData`;
        }
        else{
            bodyRequest += `    undefined`;
        }
        bodyRequest += `,${EOL}    extra);${EOL}`;

        let bodyLines = [...this.preBodyLines];
        bodyLines.push(bodyRequest);
        bodyLines.push('const result = await promise;');
        bodyLines.push('return result;');

        const writingClientMethod = config?.hooks?.writingClientMethod;
        writingClientMethod && writingClientMethod(this, bodyLines, context);

        let content = '';
        let parameters = this.writeParameters(context, spacing);
        let returnType = this.writeReturnType(context);

        content += `${spacing}async ${this.name}(${parameters}) : ${returnType} {${EOL}`;
        content += spacing;
        content += spacing;
        let body = bodyLines.join(EOL);
        content += body.split(EOL).join(`${EOL}${spacing}${spacing}`);
        content += EOL;
        content += `${spacing}}${EOL}`;
        return content;
    }
}