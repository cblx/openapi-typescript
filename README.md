# openapi-typescript
openapi client generator for typescript


openapi-typescript.config.js

```
var config = {
    url: "<url>/swagger.json",
    outputDir: "./src/client",
};

module.exports = config;
```
-------------

Angular suggestion:

create an app-connector.ts

```
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OpenApiConnector } from '@cblx.br/openapi-typescript';

@Injectable({
    providedIn: 'root'
})
export class AppConnector implements OpenApiConnector {

    constructor(@Inject('BASE_URL') private baseUrl: string, private http: HttpClient) {}

    async request(method: string, path: string, parameters: any, body: any) {
        return await this.http.request(method, this.baseUrl + path, {
            body: body,
            params: parameters
        }).toPromise();
    }
}

```
