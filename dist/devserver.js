var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDevServer = void 0;
const open_1 = __importDefault(require("open"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const morgan_1 = __importDefault(require("morgan"));
const tiny_lr_1 = __importDefault(require("tiny-lr"));
const connect_1 = __importDefault(require("connect"));
const chokidar_1 = __importDefault(require("chokidar"));
const serve_static_1 = __importDefault(require("serve-static"));
const staticc_1 = require("staticc");
const lib_1 = require("./lib");
async function startDevServer(data_json_path, interpretingMode) {
    //@ts-ignore
    let modulePath = require.main.path;
    modulePath = modulePath.replace('__tests__', 'dist');
    const TinyLr = tiny_lr_1.default();
    let usedFiles = new Set([]);
    let data = await readDataJson(data_json_path);
    await staticc_1.build(data, {
        productive: false,
        interpretingMode: interpretingMode,
    });
    let blockBuild = true;
    setTimeout(async () => {
        blockBuild = false;
    }, 1000);
    const tinylrPort = 7777;
    const httpPort = 8888;
    const webserver = connect_1.default();
    webserver.use(morgan_1.default('dev'));
    webserver.use((req, res, next) => {
        if (!req.originalUrl)
            next();
        let url = req.originalUrl;
        if (url.indexOf('/') == 0)
            url = url.replace('/', '');
        if (path_1.default.extname(url) === '.html')
            usedFiles.add(path_1.default.join(process.cwd(), 'dist', url));
        if (url === '')
            usedFiles.add(path_1.default.join(process.cwd(), 'dist', 'index.html'));
        next();
    });
    webserver.use(require('connect-livereload')({
        port: tinylrPort,
        serverPort: httpPort,
    }));
    webserver.use(serve_static_1.default('./dist'));
    TinyLr.listen(tinylrPort);
    http_1.default.createServer(webserver).listen(httpPort);
    chokidar_1.default.watch('./src/').on('all', async (event, filepath) => {
        if (event === 'unlink') {
            usedFiles = new Set([...usedFiles].filter((file) => !file.includes(filepath.replace('src', 'dist'))));
        }
        else {
            let files = [];
            let tinyLrFiles = [path_1.default.resolve(__dirname + '/' + filepath)];
            if (path_1.default.extname(filepath) === '.html') {
                files = [filepath];
            }
            else {
                files = [...usedFiles].map((file) => file.replace('dist', 'src'));
                tinyLrFiles = [...usedFiles];
            }
            if (!blockBuild)
                await await staticc_1.build(data, {
                    productive: false,
                    interpretingMode: interpretingMode,
                    filesToBuild: files,
                });
            TinyLr.changed({
                body: {
                    files: tinyLrFiles,
                },
            });
        }
    });
    chokidar_1.default.watch('./prefabs/').on('all', async () => {
        if (!blockBuild)
            await await staticc_1.build(data, {
                productive: false,
                interpretingMode: interpretingMode,
            });
        TinyLr.changed({
            body: {
                files: [...usedFiles],
            },
        });
    });
    chokidar_1.default.watch('./data.json').on('all', async () => {
        if (!blockBuild) {
            data = await readDataJson(data_json_path);
            await await staticc_1.build(data, {
                productive: false,
                interpretingMode: interpretingMode,
            });
        }
        TinyLr.changed({
            body: {
                files: [...usedFiles],
            },
        });
    });
    console.log('Development Server started!');
    open_1.default('http://127.0.0.1:8888');
}
exports.startDevServer = startDevServer;
async function readDataJson(data_json_path) {
    return JSON.parse(await lib_1.readFileFromDisk(data_json_path));
}
