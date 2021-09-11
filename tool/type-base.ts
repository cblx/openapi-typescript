import * as changeCase from 'change-case'
import { SchemaObject } from 'openapi3-ts';
import { OpenApiTypeScriptConfig } from './config';
export abstract class TypeBase {
    name: string;
    fileName: string;
    dir: string = '/';
    public typeConfig: {
        generateMetadata?: boolean,
        generateSchemaFile?: boolean
    }

    constructor(
        id: string,
        public readonly schema: SchemaObject,
        protected config: OpenApiTypeScriptConfig) {

        const defaultConfig = this.config.models?.default || {};
        const modelConfig = this.config?.models ? this.config.models[id] || {} : {};
        this.typeConfig = { ...defaultConfig, ...modelConfig };

        this.name = id.replace('[]', 'Array');
        let splitted = this.name.split('.');
        this.name = [...splitted].reverse()[0];
        if (splitted.length > 1) {
            this.dir = `/${splitted.slice(0, splitted.length - 1).map(d => changeCase.paramCase(d)).join('/')}/`;
        }

        this.fileName = `${changeCase.paramCase(this.name)}.ts`;
    }

    getPath() {
        return `${this.dir}${this.fileName}`;
    }

    getSchemaFilePath() {
        return this.getPath().replace('.ts', '.schema.ts');
    }

    public abstract write(): string;

    writeSchemaFile() {
        let content = `export const ${this.name}_SCHEMA = ${JSON.stringify(this.schema, null, 4)};\n\n`;
        return content;
    }
}
