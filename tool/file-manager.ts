import * as fs from 'fs';
import * as path from 'path';
import colors from 'chalk';

const stateFileName = '.openapi-typescript';
export class FileManager {
    private currentState: string[] = [];
    private newState: string[] = [];

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
                let state = JSON.parse(content);
                if(!Array.isArray(state)){ return; }
                state = state.filter(item => typeof item ==='string');
                this.currentState = state;
            } catch { }
        }
    }

    write(fileName: string, content: string) {
        const filePath = path.join(this.dir, fileName);
        this.newState.push(filePath);
        ensureFileDirExists(filePath);
        if (fs.existsSync(filePath)) {
            const buff = Buffer.from(content);
            if(buff.equals(fs.readFileSync(filePath))){ return; }
            console.log(colors.blue(`${filePath} - CHANGED`));
        }else{
            console.log(colors.cyan(`${filePath} - ADDED`));
        }
        fs.writeFileSync(filePath, content);
    }

    deleteOldFiles() {
        for(let path of this.currentState){
            if(this.newState.includes(path)){ continue; }
            fs.unlinkSync(path);
            console.log(colors.red(`${path} - DELETED`));
        }
    }

    saveState() {
        const stateFilePath = path.join(this.dir, stateFileName);
        this.newState.sort();
        const newStateContent = JSON.stringify(this.newState, null, 2);
        fs.writeFileSync(stateFilePath, newStateContent);
        this.currentState = JSON.parse(newStateContent);
        this.newState = [];
    }
}

function ensureFileDirExists(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureFileDirExists(dirname);
    fs.mkdirSync(dirname);
}
