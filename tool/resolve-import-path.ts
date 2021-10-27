import * as path from 'path';
export function resolveImportPath(params: { tsFile: string, fromDir: string }) {
    let relativePath = path.relative(params.fromDir, params.tsFile).replace('\\', '/');
    if (relativePath[0] != '.') {
        if (relativePath[0] != '/') {
            relativePath = '/' + relativePath;
        }
        relativePath = '.' + relativePath;
    }
    relativePath = relativePath.replace('.ts', '');
    relativePath = relativePath.replace('.//', './');
    return relativePath;
}