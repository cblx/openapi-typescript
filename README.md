# openapi-typescript

![npm](https://img.shields.io/npm/v/@cblx-br/openapi-typescript?logo=npm)

openapi client generator for typescript

`npm install @cblx-br/openapi-typescript --save-dev`


create an openapi-typescript.config.js

```
var config = {
    url: "<url>/swagger.json",
    outputDir: "./src/client",
};

module.exports = config;
```

execute it:

`npx openapi-typescript`

Then create an implementation for your connector using the tool of your choice (fetch, jquery ajax, etc...).

```
export class MyAppConnector implements OpenApiConnector {
     async request(method: string, path: string, parameters: any, body: any) {
         ... implementation ...
     }
}
```
Use your connector with your client api service.
```
var myApi = new MyApiClient(new MyAppConnector());
let result = await myApi.get();
```
Examples: [Fetch](#fetch-connector-example), [Angular](#angular-connector-example)

-------------
## Friendly function names

For friendly function names, set the desired name in the operantionId field of your schema.

-------------

## Enum names

This tool supports the 'x-enum-varnames' extension

-------------

## Fetch connector example

```
import { OpenApiConnector } from "@cblx-br/openapi-typescript";

class MyAppConnector extends OpenApiConnector {
    async request(method: string, path: string, parameters: any, body: any) {
        var url = new URL(location.origin + '/' + path);
        if (parameters) {
            Object.keys(parameters).forEach(key => {
                let value = parameters[key];
                if (value === null || value === undefined) { value = ''; }
                url.searchParams.append(key, value);
            });
        }

        let response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: method,
            body: body ? JSON.stringify(body) : undefined
        });

        if (response.status != 200) {
            throw await response.json();
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') == 0) {
            return await response.json();
        }
    }
}

export const connector = new MyConnector();
```

## Angular connector example

create an app-connector.ts

```
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OpenApiConnector } from '@cblx-br/openapi-typescript';

@Injectable({
    providedIn: 'root'
})
export class MyAppConnector implements OpenApiConnector {

    constructor(private http: HttpClient) {}

    async request(method: string, path: string, parameters: any, body: any) {
        return await this.http.request(method, '/' + path, {
            body: body,
            params: parameters
        }).toPromise();
    }
}

```

app.module.ts
```
@NgModule({
  declarations: [...],
  imports: [
    ...
    HttpClientModule
  ],
  providers: [
    {
      provide: OpenApiConnector,
      useClass: MyAppConnector
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

```

openapi-typescript.config.js

```
var config = {
    url: "<url>/swagger.json",
    outputDir: "./src/client",
    hooks: {
          writingClient(client, context) {
            client.importsSection.push(`import { Injectable } from '@angular/core';`);
            client.decoratorsSection.push(`@Injectable({ providedIn: 'root' })`);
        }
    }
};

module.exports = config;
```

Then inject your client api services wherever you need...

```
@Component(...)
export class MyComponent{
    constructor(myApiClient: MyApiClient){
        ...
    }
}
```
