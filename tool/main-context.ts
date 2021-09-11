import { BaseContext } from './base-context';
import { ClientType } from './client-type';


export class SolutionContext extends BaseContext {
    services: ClientType[] = [];
    constructor() {
        super();
    }

    genereate() : { [filePath: string]: string } {
        const result = {};
        for(let modelId in this.modelsAndEnums)        {
            let model = this.modelsAndEnums[modelId];
            result[model.getPath()] = model.write();
            if(model.typeConfig.generateSchemaFile === true){
                result[model.getSchemaFilePath()] = model.writeSchemaFile();
            }
        }

        for(let service of this.services){
            result[service.getPath()] = service.write();
        }
        return result;
    }
}
