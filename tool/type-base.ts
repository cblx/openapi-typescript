import * as changeCase from 'change-case'
import { SchemaObject } from 'openapi3-ts';
export abstract class TypeBase {
    name: string;
    fileName: string;
    dir: string = '/';


    constructor(protected id: string) {
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

  
    public abstract write(): string;


}
