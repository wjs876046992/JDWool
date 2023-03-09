const WP_APP_TOKEN_ONE = process.env.WP_APP_TOKEN_ONE
const WP_APP_COMBINE_NOTIFY = process.env.WP_APP_COMBINE_NOTIFY === 'true'
const WP_APP_TOPICS = (process.env.WP_APP_TOPICS || '').split(';')
const WP_APP_NOTICE_URL = process.env.WP_APP_NOTICE_URL || 'https://fastrabbit.20220727.xyz'``````````````````````````````````````````````

const isPushWxPusher = WP_APP_TOKEN_ONE && process.env.PUSH_WX_PUSHER

const ql = require('../common/ql')
const callAPI = require('../common/ApiCaller')


const extractUIDFromEnv = (env) => {
    if (!env || !env.remarks || env.remarks.indexOf("UID_") === -1) {
        return
    }
    const matched = env.remarks.match(/(UID_.+)@@|(UID_.+)/)
    if (matched) {
        return matched[0].split("@@")[0]
    }
}

const doSend = async (uids, title, content, summary) => {
    let desp = `<font size="4"><b>${title}</b></font>\n\n<font size="3">${content}</font>`;
    desp = desp.replace(/[\n\r]/g, '<br>'); // 默认为html, 不支持plaintext
    const options = {
        url: `https://wxpusher.zjiecode.com/api/send/message`,
        json: {
            appToken: `${WP_APP_TOKEN_ONE}`,
            content: `${desp}`,
            summary,
            contentType: 2,
            topicIds: WP_APP_TOPICS,
            uids,
            url: `${WP_APP_NOTICE_URL}`,
        },
        headers: {
            "Content-Type": "application/json",
        },
        method: 'post'
    }
    return await callAPI(options)
}

/**
 * WxPusher 通知
 * @param title
 * @param content
 * @param account WxPusher UID or JD pt_pin
 * @param summary
 * @param author
 * @returns {Promise<void>}
 */
const sendWxPusherNotice = async (title, content, account, summary = '', author = 'Notify By Herman Wu') => {
    if (!isPushWxPusher) {
        console.log("export WP_APP_TOKEN_ONE=\"WxPusher的appToken\" export PUSH_WX_PUSHER=\"true\"开启通知");
        return
    }
    let uid
    if (!account.startsWith("UID_")) {
        const env = await ql.getEnvByPtPin(account)
        uid = (env && extractUIDFromEnv(env)) || env.remarks
    } else {
        uid = account
    }
    if (!uid || !uid.startsWith('UID_')) {
        console.log(`查找到的UID[${uid}]不符合规则，取消通知`)
        return
    }
    const ret = await doSend([uid], title, content, summary);
    if (ret.code !== 0) {
        console.log(`WxPusher发送失败，未知错误：${ret.code}, ${ret.errMsg}`)
        return
    }
    if (ret.data.code === 1000) {
        console.log('WxPusher发送通知消息成功🎉\n')
    }
}

module.exports = sendWxPusherNotice
// !(async () => {
//     await sendWxPusherNotice('title', 'haha', 'UID_Xi8AYcdidP9fzeQ10tXyw68CNjzI', '摘要')
// })()
