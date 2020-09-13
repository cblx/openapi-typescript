import { OpenAPIObject, PathItemObject } from 'openapi3-ts';
import * as changeCase from 'change-case';

export function organizeActionsInClients(json: OpenAPIObject) {
    const clients:{
        [name: string] : { actions: { [name: string]: PathItemObject } }
    } = {};
    //Entre os paths
    for (let p in json.paths) {

        //Pego as actions
        let actions: { [key: string]: PathItemObject } = json.paths[p];

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

    return clients;
}