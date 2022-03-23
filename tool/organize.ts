import { OpenAPIObject, PathItemObject } from 'openapi3-ts';
import * as changeCase from 'change-case';
export function organizeActionsInClients(json: OpenAPIObject) {
    const clients:{
        [name: string] : { actions: { [name: string]: PathItemObject } }
    } = {};
    
    for (let p in json.paths) {       
        let actions: { [key: string]: PathItemObject } = json.paths[p];

        for (let a in actions) {
            if(a === 'parameters'){ continue; }
            let action = actions[a];
            let clientName = (action.tags || ['Default'])[0];
            // dotnet generic controllers will have ` in the name
            clientName = clientName.replace('`', '');

            if (!(clientName in clients)) {
                clients[clientName] = {
                    actions: {}
                };
            }

            action.path = p;
            if (action.path.startsWith('/')) {
                action.path = action.path.substring(1);
            }

            action.httpMethod = a;

            // Fallback function name
            let functionName = `${a}${changeCase.pascalCase(action.path)}`;

            if (action.operationId) {
                functionName = changeCase.camelCase(action.operationId);
            }

            // Mix root parameters with the action parameters
            action.parameters = [...(<any>actions.parameters ?? []), ...(action.parameters ?? []) ];

            clients[clientName].actions[functionName] = action;
            
        }
    }

    return clients;
}