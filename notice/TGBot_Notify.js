const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN
const TG_USER_ID = process.env.TG_USER_ID
const TG_API_HOST = process.env.TG_API_HOST || 'api.telegram.org'
const TG_PROXY_HOST = process.env.TG_PROXY_HOST
const TG_PROXY_PORT = process.env.TG_PROXY_PORT
const TG_PROXY_AUTH = process.env.TG_PROXY_AUTH
const callAPI = require('../common/ApiCaller')

async function tgBotNotify(text, desp, notifyBy = 'Notify By Herman Wu') {

    if (!TG_BOT_TOKEN || !TG_USER_ID) {
        console.log('Telegram配置错误。\n')
        return
    }

    const options = {
        url: `https://${TG_API_HOST}/bot${TG_BOT_TOKEN}/sendMessage`,
        json: {
            chat_id: `${TG_USER_ID}`,
            text: `${text}\n\n${desp}\n\n${notifyBy}`,
            disable_web_page_preview: true,
        },
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'post',
    }
    if (TG_PROXY_HOST && TG_PROXY_PORT) {
        const tunnel = require("tunnel")
        const agent = {
            https: tunnel.httpsOverHttp({
                proxy: {
                    host: TG_PROXY_HOST,
                    port: TG_PROXY_PORT * 1,
                    proxyAuth: TG_PROXY_AUTH
                }
            })
        }
        Object.assign(options, {agent})
    }
    const ret = await callAPI(options)
    if (ret.code !== 0) {
        console.log(`Telegram发送失败，未知错误：${ret.code}, ${ret.errorMsg}`)
        return
    }
    if (ret.data.ok) {
        console.log('Telegram发送通知消息成功🎉\n')
    } else if (ret.data.error_code === 400) {
        console.log('请主动给bot发送一条消息并检查接收用户ID是否正确。\n')
    } else if (ret.data.error_code === 401) {
        console.log('Telegram bot token 填写错误。\n')
    }
}

module.exports = tgBotNotify
