import open from 'open'
import http from 'http'
import pathLib from 'path'
import morgan from 'morgan'
import tinylr from 'tiny-lr'
import connect from 'connect'
import chokidar from 'chokidar'
import serveStatic from 'serve-static'
import { build, InterpretingMode } from 'staticc'
import { readFileFromDisk } from './lib'

export async function startDevServer(data_json_path: string, interpretingMode: InterpretingMode) {
    //@ts-ignore
    let modulePath = require.main.path
    modulePath = modulePath.replace('__tests__', 'dist')
    const TinyLr = tinylr()
    let usedFiles: Set<string> = new Set([])

    let data = await readDataJson(data_json_path)

    await build(data, {
        productive: false,
        interpretingMode: interpretingMode,
    })

    let blockBuild = true
    setTimeout(async () => {
        blockBuild = false
    }, 1000)

    const tinylrPort = 7777
    const httpPort = 8888

    const webserver = connect()
    webserver.use(morgan('dev'))
    webserver.use((req, res, next) => {
        if (!req.originalUrl) next()
        let url: string = req.originalUrl as string
        if (url.indexOf('/') == 0) url = url.replace('/', '')
        if (pathLib.extname(url) === '.html') usedFiles.add(pathLib.join(process.cwd(), 'dist', url))
        if (url === '') usedFiles.add(pathLib.join(process.cwd(), 'dist', 'index.html'))
        next()
    })
    webserver.use(
        require('connect-livereload')({
            port: tinylrPort,
            serverPort: httpPort,
        })
    )
    webserver.use(serveStatic('./dist'))
    TinyLr.listen(tinylrPort)
    http.createServer(webserver).listen(httpPort)

    chokidar.watch('./src/').on('all', async (event, filepath) => {
        if (event === 'unlink') {
            usedFiles = new Set([...usedFiles].filter((file) => !file.includes(filepath.replace('src', 'dist'))))
        } else {
            let files: string[] = []
            let tinyLrFiles: string[] = [pathLib.resolve(__dirname + '/' + filepath)]
            if (pathLib.extname(filepath) === '.html') {
                files = [filepath]
            } else {
                files = [...usedFiles].map((file) => file.replace('dist', 'src'))
                tinyLrFiles = [...usedFiles]
            }
            if (!blockBuild)
                await await build(data, {
                    productive: false,
                    interpretingMode: interpretingMode,
                    filesToBuild: files,
                })
            TinyLr.changed({
                body: {
                    files: tinyLrFiles,
                },
            })
        }
    })
    chokidar.watch('./prefabs/').on('all', async () => {
        if (!blockBuild)
            await await build(data, {
                productive: false,
                interpretingMode: interpretingMode,
            })
        TinyLr.changed({
            body: {
                files: [...usedFiles],
            },
        })
    })
    chokidar.watch('./data.json').on('all', async () => {
        if (!blockBuild) {
            data = await readDataJson(data_json_path)
            await await build(data, {
                productive: false,
                interpretingMode: interpretingMode,
            })
        }
        TinyLr.changed({
            body: {
                files: [...usedFiles],
            },
        })
    })
    console.log('Development Server started!')
    open('http://127.0.0.1:8888')
}

async function readDataJson(data_json_path: string) {
    return JSON.parse(await readFileFromDisk(data_json_path))
}