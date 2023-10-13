const { App } = require('@sifrr/server')
const { MarioMsg, MarioListMsg } = require("./proto/mario_pb")
const fs = require('fs')
const ws_port = 5001
const port = 80

const badwords = fs.readFileSync('otherTools/profanity_filter.txt').toString().split('\n')

//// Sockets
const allSockets = {}

let currentId = 0
const generateID = () => {
    if (++currentId > 1000000) currentId = 0
    return currentId
}

const sendDataWithOpcode = (bytes, opcode, socket) => {
    const newbytes = new Uint8Array(bytes.length + 1)
    newbytes.set([opcode], 0)
    newbytes.set(bytes, 1)
    socket.send(newbytes, true)
}

const broadcastDataWithOpcode = (bytes, opcode) => {
    const newbytes = new Uint8Array(bytes.length + 1)
    newbytes.set([opcode], 0)
    newbytes.set(bytes, 1)
    Object.values(allSockets).forEach(s => { s.socket.send(newbytes, true) })
}

const sendMainUpdate = (socket) => {
    const filteredMarios = Object.entries(allSockets).filter(([id, data]) => {
        return id != socket.id && data.valid != 0
    }).map(([id]) => { return allSockets[id].decodedMario })

    const mariolistmsg = new MarioListMsg()
    mariolistmsg.setMarioList(filteredMarios)
    sendDataWithOpcode(mariolistmsg.serializeBinary(), 0, socket)
}


const processPlayerData = (socketID, bytes) => {
    const decodedMario = MarioMsg.deserializeBinary(bytes)

    //Pretty strict validation
    for (let i = 0; i < 3; i++) {
        if (isNaN(decodedMario.getPosList()[i])) return
        if (isNaN(decodedMario.getAngleList()[i])) return
    }
    if (isNaN(decodedMario.getAnimframe())) return
    if (isNaN(decodedMario.getAnimid()) || 0 > decodedMario.getAnimid()) return
    if (isNaN(decodedMario.getSkinid()) || 0 > decodedMario.getSkinid() || decodedMario.getSkinid() > 9) return
    decodedMario.setPlayername(String(decodedMario.getPlayername()).substring(0, 14))
    decodedMario.setSocketid(socketID)

    /// Data is Valid
    allSockets[socketID].decodedMario = decodedMario
    allSockets[socketID].valid = 60
}


const processBasicAttack = (socketID, bytes) => {

    if (allSockets[socketID].valid == 0) return

    const attackMsg = JSON.parse(new TextDecoder("utf-8").decode(bytes))
    attackMsg.attackerID = socketID
    const responseMsg = new TextEncoder("utf-8").encode(JSON.stringify(attackMsg))
    sendDataWithOpcode(responseMsg, 2, allSockets[attackMsg.id].socket)
}

const processKnockUp = (socketID, bytes) => {

    if (allSockets[socketID].valid == 0) return

    const attackMsg = JSON.parse(new TextDecoder("utf-8").decode(bytes))
    const responseMsg = new TextEncoder("utf-8").encode(JSON.stringify(attackMsg))
    sendDataWithOpcode(responseMsg, 4, allSockets[attackMsg.id].socket)
}

const processChat = (socketID, bytes) => {
    const chatmsg = JSON.parse(new TextDecoder("utf-8").decode(bytes))
/*    badwords.forEach(word => {
        const searchMask = word.slice(0, word.length)
        const regEx = new RegExp(searchMask, "ig");
        chatmsg.msg = chatmsg.msg.replace(regEx, "*****")
    })*/
    chatmsg.socketID = socketID

    const decodedMario = Object.values(allSockets).find(data => data.socket.id == socketID).decodedMario

    if (decodedMario == undefined) return
    chatmsg.sender = decodedMario.getPlayername()
    
    const responseMsg = new TextEncoder("utf-8").encode(JSON.stringify(chatmsg))
    broadcastDataWithOpcode(responseMsg, 1)
}

const game_loop = setInterval(() => {
    Object.values(allSockets).forEach(data => {
        sendMainUpdate(data.socket)
        if (data.valid > 0) data.valid--
        else if (data.decodedMario) data.socket.end()
    })

}, 15)

new App({}).ws('/*', {
    open: (socket) => {
        socket.id = generateID()
        allSockets[socket.id] = { valid: 0, socket }
        const responseMsg = new TextEncoder("utf-8").encode(JSON.stringify({ id: socket.id }))
        sendDataWithOpcode(responseMsg, 3, socket)
    },
    message: (socket, bytes) => {
        try {
            const opcode = Buffer.from(bytes)[0]
            switch (opcode) {
                case 0: processPlayerData(socket.id, bytes.slice(1)); break
                case 1: processChat(socket.id, bytes.slice(1)); break
                case 2: processBasicAttack(socket.id, bytes.slice(1)); break
                case 4: processKnockUp(socket.id, bytes.slice(1)); break
                default: console.log("unknown opcode: " + opcode)
            }
        } catch (err) { console.log(err) }
    },
    close: (socket) => {
        delete allSockets[socket.id]
    }
}).listen(ws_port, () => { console.log('Starting websocker server') })


//// Express Static serving

const express = require('express')
const app = express()
const http = require('http')
const server = http.Server(app)

app.use(express.static(__dirname + '/dist'))
server.listen(port, () => { console.log('Serving Files with express server') })


/////// necessary for server side rom extraction

const { promisify } = require('util')
const { spawn } = require('child_process')
const { v4: uuidv4 } = require('uuid')

app.get('/romTransfer', async (req, res) => {
    console.log("rom transfer")

    const uid = uuidv4()
    await mkdir('extractTools/' + uid)

    const file = fs.createWriteStream('extractTools/' + uid + '/baserom.us.z64')
    await fileDownload(file, 'http://' + req.query.romExternal)

    return res.send(await extractJsonFromRomFile(uid))
})

const mkdir = promisify(fs.mkdir)

const pythonExtract = (dir) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', ['extract_assets.py', 'us', dir], { cwd: 'extractTools/' })
        //pythonProcess.stdout.on('data', (data) => { console.log(data.toString()) })
        //pythonProcess.stderr.on('data', (data) => { console.log(data.toString()) })
        pythonProcess.stderr.on('close', () => { resolve() })
    })
}

const fileDownload = (file, url) => {
    return new Promise((resolve, reject) => {
        try {
            http.get(url, (response) => {
                const stream = response.pipe(file)
                stream.on('error', () => { reject('Fail') })
                stream.on('finish', () => { resolve('Success') })
            })
        } catch {
            console.log("HTTP GET Error")
            fs.rmdirSync('extractTools/' + uid, { recursive: true })
            reject('Fail')
        }
    })
}

const extractJsonFromRomFile = async (dir) => {
    return new Promise(async (resolve, reject) => {
        try {
            await pythonExtract(dir)

            const extractedData = {}
            const assets = JSON.parse(fs.readFileSync('extractTools/assets.json'))
            Object.keys(assets).forEach((assetname) => {
                let filepath = assetname
                if (filepath == '@comment') return
                if (filepath.indexOf("skyboxes") != -1) { /// skybox
                    filepath = `extractTools/${dir}/${filepath}`
                    filepath = filepath.slice(0, filepath.length - 4) + "_skybox.c"
                    let filedata = fs.readFileSync(filepath, "utf8")
                    filedata = filedata.replace(/\r/g, "")
                    let lines = filedata.split("\n")
                    lines = lines.filter(line => (line.length != 0) && (line[0] != '/'))
                    while (lines.length > 0) {
                        let section = lines.splice(0, 2)
                        if (section[0].slice(0, 24) == 'ALIGNED8 static const u8') {
                            const textureName = section[0].slice(25, section[0].length - 6)
                            const textureData = section[1].slice(0, section[1].indexOf('}'))
                            extractedData[textureName] = Buffer.from(textureData.split(','))
                        }
                    }
                } else {  /// not skybox
                    filepath = `extractTools/${dir}/${filepath}`
                    filepath = filepath.substring(0, filepath.length - 4)
                    const filedata = fs.readFileSync(filepath)
                    extractedData[assetname] = filedata
                }
            })
            fs.rmdirSync('extractTools/' + dir, { recursive: true })
            resolve(extractedData)
        } catch {
            console.log('Rom Extraction Fail')
            fs.rmdirSync('extractTools/' + dir, { recursive: true })
            resolve('Fail')
        }
    })
}