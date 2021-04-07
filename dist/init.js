var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeProject = void 0;
const path_1 = __importDefault(require("path"));
const cross_spawn_1 = require("cross-spawn");
const lib_1 = require("./lib");
const child_process_1 = require("child_process");
const version = require('../package.json').version;
async function initializeProject(legacy) {
    console.log('\n\nInitializing staticc project!\n\n');
    const files = legacy ? legacyInitFiles : initFiles;
    Object.keys(files).forEach(async (filepath) => {
        await lib_1.saveFileToDisk(filepath, files[filepath]);
    });
    let childProcess;
    try {
        if (checkIfYarnIsInstalled()) {
            childProcess = cross_spawn_1.spawn('yarn', ['install']);
        }
        else {
            childProcess = cross_spawn_1.spawn('npm', ['install']);
        }
    }
    catch (error) {
        if (error)
            console.error('Could not install babel and its packages. Please run "npm install" or "yarn install" yourself.');
        return;
    }
    childProcess.stdout.setEncoding('utf8');
    childProcess.stdout.on('data', (chunk) => {
        console.log(chunk);
    });
    childProcess.on('close', () => {
        console.log('Finished!');
    });
}
exports.initializeProject = initializeProject;
function checkIfYarnIsInstalled() {
    try {
        child_process_1.execSync('yarn -v');
        return true;
    }
    catch (error) {
        return false;
    }
}
const initFiles = {};
initFiles[path_1.default.join('prefabs', 'count_to_n', 'prefab.js')] =
    'const arr = []\nfor (let i = 0; i < args[0]; i++) {\n    arr.push("<" + args[1] + ">" + i.toString() + "</" + args[1] + ">")\n}\nrender(arr)';
initFiles[path_1.default.join('prefabs', 'hello_world', 'prefab.html')] = '<h5>Hello, World!</h5>';
initFiles[path_1.default.join('src', 'index.html')] =
    '<!DOCTYPE html>\n<html>\n    <head>\n        <title>{{title}}</title>\n    </head>\n    <body>\n        <h1>{{title}}</h1>\n        {{\n            # data.shop_items.map(item=>{\n                return `<h2>${item}</h2>`\n            })\n        }}\n        {{\n            !hello_world\n        }}\n        {{\n            !!count_to_n 5 {{type}}\n        }}\n    </body>\n</html>';
initFiles['data.json'] = '{\n    "title": "STATICC Webpage",\n    "shop_items": ["Item 1", "Item 2", "Item 3"],\n    "type" : "h6"\n}';
initFiles['package.json'] = `{\n  "name": "staticc-project",\n  "version": "1.0.0",\n  "main": "index.js",\n  "license": "UNLICENSED",\n  "scripts": {\n    "build": "staticc build",\n    "build-dev": "staticc build-dev",\n    "serve": "staticc serve"\n  },\n  "devDependencies": {\n    "staticc-cli": "${version}"\n  },\n  "dependencies": {}\n}\n`;
const legacyInitFiles = {};
legacyInitFiles[path_1.default.join('prefabs', 'count_to_3', 'prefab.js')] =
    'const arr = []\nfor (let i = 0; i < 3; i++) {\n    arr.push("<" + args[0] + ">" + i.toString() + "</" + args[0] + ">")\n}\nrender(arr)';
legacyInitFiles[path_1.default.join('prefabs', 'hello_world', 'prefab.html')] = '<h5>Hello, World!</h5>';
legacyInitFiles[path_1.default.join('src', 'index.html')] =
    '<!DOCTYPE html>\n<html>\n    <head>\n        <title>{{title}}</title>\n    </head>\n    <body>\n        <h1>{{title}}</h1>\n        {{\n            # data.shop_items.map(item=>{\n                return `<h2>${item}</h2>`\n            })\n        }}\n        {{\n            !hello_world\n        }}\n        {{\n            !!count_to_3 type\n        }}\n    </body>\n</html>';
legacyInitFiles['data.json'] = '{\n    "title": "STATICC Webpage",\n    "shop_items": ["Item 1", "Item 2", "Item 3"],\n    "type" : "h6"\n}';
legacyInitFiles['package.json'] = `{\n  "name": "staticc-project",\n  "version": "1.0.0",\n  "main": "index.js",\n  "license": "ISC",\n  "scripts": {\n    "build": "staticc build",\n    "build-dev": "staticc build-dev",\n    "serve": "staticc serve"\n  },\n  "devDependencies": {\n    "@babel/core": "^7.12.3",\n    "@babel/plugin-transform-exponentiation-operator": "^7.12.1",\n    "@babel/plugin-transform-for-of": "^7.12.1",\n    "@babel/plugin-transform-instanceof": "^7.12.1",\n    "@babel/plugin-transform-literals": "^7.12.1",\n    "@babel/plugin-transform-runtime": "^7.12.1",\n    "@babel/plugin-transform-shorthand-properties": "^7.12.1",\n    "@babel/plugin-transform-spread": "^7.12.1",\n    "@babel/plugin-transform-sticky-regex": "^7.12.1",\n    "@babel/plugin-transform-template-literals": "^7.12.1",\n    "@babel/plugin-transform-typeof-symbol": "^7.12.1",\n    "@babel/preset-env": "^7.12.1",\n    "cross-spawn": "^7.0.3",\n    "staticc-cli": "${version}"\n  }\n}\n`;
