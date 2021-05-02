import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as colors from 'colors';

const stateFileName = '.openapi-typescript';
export class FileManager {
    private currentState: FilesState = { files: {} };
    private newState: FilesState = { files: {} };

    constructor(private dir: string) {
        this.ensureRootDirExists();
        this.loadCurrentState();
    }

    private ensureRootDirExists() {
        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir);
        }
    }

    private loadCurrentState() {
        const stateFilePath = path.join(this.dir, stateFileName);
        if (fs.existsSync(stateFilePath)) {
            try {
                const content = fs.readFileSync(stateFilePath, { encoding: 'utf8', flag: 'r' });
                this.currentState = JSON.parse(content);
            } catch { }
        }
    }

    write(fileName: string, content: string) {
        const hash = crypto.createHash('sha1').update(content).digest('base64');
        const filePath = path.join(this.dir, fileName);
        this.newState.files[filePath] = hash;
        if (this.currentState.files[filePath] == hash) {
            return;
        }
        ensureFileDirExists(filePath);
        if (fs.existsSync(filePath)) {
            console.log(colors.blue(`${filePath} - CHANGED`));
        }else{
            console.log(colors.cyan(`${filePath} - ADDED`));
        }
        fs.writeFileSync(filePath, content);
    }

    deleteOldFiles() {
        for (let path in this.currentState.files) {
            if (!(path in this.newState.files)) {
                fs.unlinkSync(path);
                console.log(colors.red(`${path} - DELETED`));
            }
        }
    }

    saveState() {
        const stateFilePath = path.join(this.dir, stateFileName);
        const newStateContent = JSON.stringify(this.newState, null, 2);
        fs.writeFileSync(stateFilePath, newStateContent);
        this.currentState = JSON.parse(newStateContent);
        this.newState = { files: {} };
    }
}

interface FilesState {
    files: { [path: string]: string };
}

function ensureFileDirExists(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureFileDirExists(dirname);
    fs.mkdirSync(dirname);
}
