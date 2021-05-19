import { OpenAPIObject, PathItemObject } from 'openapi3-ts';
import * as changeCase from 'change-case';

export function organizeActionsInClients(json: OpenAPIObject) {
    const clients:{
        [name: string] : { actions: { [name: string]: PathItemObject } }
    } = {};
    
    for (let p in json.paths) {       
        let actions: { [key: string]: PathItemObject } = json.paths[p];

        for (let a in actions) {
            let action = actions[a];
            let clientName = action.tags[0];
            //Controllers genéricos trarão ` no nome
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

            // Remove this support. "operationId" should be the only valid option for setting function name
            if (action.tags[1]) {
                functionName = changeCase.camelCase(action.tags[1]);
            }

            // Function name from operationId
            if (action.operationId) {
                functionName = changeCase.camelCase(action.operationId);
            }

            clients[clientName].actions[functionName] = action;
        }
    }

    return clients;
}
