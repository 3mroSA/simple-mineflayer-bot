
const commands = require('./commands')

const mineflayer = require('mineflayer')

const readline = require('readline')


// Change what needs to be changed

let ip = 'hypixel.net' // Server IP
let port = 25565; // Server Port
const username = 'notch' // Your Username
const auth = 'microsoft' // Verification, for cracked account use 'offline' for premium account use 'microsoft'
const reconnect = true // Should the bot reconnect if it disconnects?
const minReconnectDelay = 2000 // Minimum delay between reconnect attempts (ms)

// Ignore this

let cBot = null
let reconnecting = false
let attempts = 0
let readChat = true
let uptime = new Date();
let botReady = false
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

rl.setPrompt("cmd> (type 'help' for commands) $")
rl.prompt()



const sleep = ms => new Promise(r => setTimeout(r, ms));

function time(old) {
    const pad = n => n.toString().padStart(2, "0");

    if (!old) {
        const date = new Date();
        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    let diff = Date.now() - old.getTime();

    let seconds = Math.floor(diff / 1000) % 60;
    let minutes = Math.floor(diff / (1000 * 60)) % 60;
    let hours = Math.floor(diff / (1000 * 60 * 60));

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}


const chalk = require('chalk')

const log = {
    base(type, color, msg) {
        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0)

        const timestamp = chalk.gray(`[${time()}]`)
        const label = color(`[${type}]`)

        console.log(`${timestamp} ${label} ${msg}`)

        rl.prompt(true)
    },

    info(msg) {
        this.base("INFO", chalk.blue, msg)
    },

    warn(msg) {
        this.base("WARN", chalk.yellow, msg)
    },

    error(msg) {
        this.base("ERROR", chalk.red, msg)
    },

    success(msg) {
        this.base("SUCCESS", chalk.green, msg)
    },
    gui(msg) {
        this.base("GUI", chalk.magenta, msg)
    },
    cmd(msg) {
        this.base("CMD", chalk.cyan, msg)
    }

}




function createBot() {
    
    if(cBot){
        cBot.removeAllListeners()
        cBot.end()
    }
    reconnecting = true

log.info('Creating bot...')


 cBot = mineflayer.createBot({
    host: ip,
    username: username,
    port: port || 25565,
    auth: auth 
})

cBot.once('login', () => {
    log.success(`Bot logged in as ${cBot.username} to ${ip}:${port || 25565}`)
    reconnecting = false
})

cBot.once("spawn", () => {
    (async () => {
        await sleep(500);

     botReady = true
     reconnecting = false
        log.success(`Bot Spawned as ${cBot.username} to ${ip}:${port || 25565}`);

     

    })();
});


cBot.on('message', (username, message) => {
    if (readChat) {
        log.info(`[CHAT]: ${username}: ${message}`)
    }
})


cBot.on('windowOpen', (window) => {

 log.info(`GUI Title: ${window.title.value}`)
    log.info(`Slots: ${window.slots.length}`)

    window.slots.forEach((item, index) => {
        if (!item) return

        log.gui(
            `Slot ${index} | ${item.name} x${item.count} | "${item.displayName}"`
        )
        
    })
    log.info('To click on an item, type "click [slot number]"')
})


cBot.on('entityHurt', () => {
    log.info(`Bot hurt, health: ${Math.floor(cBot.health)}`)
})

// Reconnecting

cBot.on('kicked', reason => {
log.warn( `Kicked from server: ${reason?.value?.translate?.value || reason?.value?.text?.value || JSON.stringify(reason?.value || reason) || "Unknown"}`)
})
cBot.on('end', () => {
    log.warn(`Bot Disconnected`)
reconnecting = false
restart()
})

cBot.on('error', err => {
    log.error(`Error: ${err}`)
restart()
})

// Commands

rl.removeAllListeners('line')
rl.on('line', (input) => {

commands(input, {cBot, log, restart, readChat, time, uptime, ip, port, username, auth, reconnect, minReconnectDelay, botReady, attempts, reconnecting})

    rl.prompt()
})
} // CreateBot function close

createBot()


function jitter(ms){
    return ms + Math.floor(Math.random() * 300)
}

function restart(){
    if (!reconnect) return log.warn('Reconnecting Disabled')
    if (reconnecting) return log.warn('Already reconnecting...')

    reconnecting = true
    attempts++

    let delay = minReconnectDelay * Math.min(attempts / 2, 5)
    delay = jitter(delay)

    log.info(`Reconnecting in ${delay / 1000}s... (Attempts: ${attempts})`)

    setTimeout(() => {
botReady = false
        createBot()
    }, delay)
}

// Error handling

process.on('uncaughtException', err => {
    log.error("Uncaught: " + err.message)
    restart()
})

process.on('unhandledRejection', err => {
    log.error("Unhandled Rejection: " + err)
    restart()
})



const oldLog = console.log // Mineflayer spams a bunch of random stuff about this, theres no clear way to disable it so i just blocked logs coming from it 
console.log = (...a) => {
    const m = a.join(" ")
    if (m.includes("Chunk size is")) return
    oldLog(...a)
}


setInterval(() => {
if(!cBot?.player && botReady){
            log.error(`Heartbeat lost. Restarting...`)
            reconnecting = false
        restart()
    }

}, 10000);