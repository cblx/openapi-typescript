export function deleteUndefineds(obj) {
    if (!obj) { return obj; }
    Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') deleteUndefineds(obj[key]);
        else if (obj[key] === undefined) delete obj[key];
    });
    return obj;
}