/* eslint-disable eqeqeq */
const Env = require('./Env')
const $ = new Env()

const timeout = 15000 // 超时时间(单位毫秒)
const QYWX_AM = process.env.QYWX_CONF
const pushQYWX = !!QYWX_AM
let corpid, corpsecret, msgtype, agentid, touser, pinUserMap = {}, accessToken, accessTokenExpiredAt
!(() => {
    if (!pushQYWX) {
        return
    }
    const QYWX_AM_AY = QYWX_AM.split(',')
    corpid = QYWX_AM_AY[0]
    corpsecret = QYWX_AM_AY[1]
    touser = QYWX_AM_AY[2]
    agentid = QYWX_AM_AY[3]
    msgtype = QYWX_AM_AY[4] || "0"

    const pinQYWX = process.env.PIN_QYWX
    if (!pinQYWX) {
        return
    }
    const pinUserArr = pinQYWX.split('&')
    for (let i = 0; i < pinUserArr.length; i++) {
        const pinUser = pinUserArr[i]
        const el = pinUser.split("=")
        pinUserMap[el[0]] = el[1] || null
    }
})()

function sendQYWXAMNotice(pin, title, content, summary = '') {
    if (!QYWX_AM) return
    return new Promise(async (resolve) => {
        const token = await getCachedAccessToken()
        const touser = changeUserId(pin)
        const qywxOptions = getQywxOptions(msgtype, title, content, summary);
        const notice = await doSendQYWXNotice(token, touser, agentid, qywxOptions)
        $.log(touser, JSON.stringify(qywxOptions), JSON.stringify(notice))
        resolve(notice)
    })
}

/**
 * 缓存token在内存中
 *
 * @returns {Promise<*>}
 */
async function getCachedAccessToken() {
    const nowTime = (new Date()).getTime()
    if (accessToken && accessTokenExpiredAt >= nowTime) {
        return accessToken
    }
    const tokenResult = await getQYWXAccessToken(corpid, corpsecret)
    accessToken = tokenResult.access_token
    if (!accessToken) {
        accessTokenExpiredAt = undefined
        $.log('access_token获取失败.', JSON.stringify(tokenResult))
        throw Error('access_token获取失败')
    }
    accessTokenExpiredAt = ((new Date()).getTime()) - (tokenResult.expires_in - 600) * 1000
    return accessToken
}

function getQYWXAccessToken(corpid, corpsecret) {
    return new Promise(async (resolve) => {
        const options = {
            url: `https://qyapi.weixin.qq.com/cgi-bin/gettoken`,
            json: {
                corpid,
                corpsecret
            },
            headers: {
                'Content-Type': 'application/json'
            },
            timeout
        }
        $.post(options, (_err, _resp, data) => {
            if (_err) throw _err
            const json = JSON.parse(data)
            resolve(json)
        })
    })
}

function doSendQYWXNotice(token, touser, agentid, op = {}) {
    return new Promise(resolve => {
        const options = {
            url: `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`,
            json: {
                touser,
                agentid,
                safe: '0',
                ...op
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }
        $.post(options, (err, resp, data) => {
            if (err) throw err
            data = JSON.parse(data)
            resolve(data)
        })
    })
}

function getQywxOptions(msgtype, title, content, summary = '') {
    const html = content.replace(/\n/g, '<br/>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
    let options
    if (!msgtype) {
        // 如不提供第四个参数,则默认进行文本消息类型推送
        options = {
            msgtype: 'text',
            text: {
                content: `${title}\n\n${content}`
            }
        }
        return options
    }
    switch (msgtype) {
        case '0':
            options = {
                msgtype: 'textcard',
                textcard: {
                    title: `${title}`,
                    description: `${summary}`,
                    url: 'https://github.com/whyour/qinglong',
                    btntxt: '更多'
                }
            }
            break

        case '1':
            options = {
                msgtype: 'text',
                text: {
                    content: `${title}\n\n${content}`
                }
            }
            break

        default:
            options = {
                msgtype: 'mpnews',
                mpnews: {
                    articles: [{
                        title: `${title}`,
                        thumb_media_id: `${msgtype}`,
                        author: `智能助手`,
                        content_source_url: ``,
                        content: `${html}`,
                        digest: `${summary}`
                    }]
                }
            }
    }
    return options
}

function changeUserId(pin) {
    if (!touser) {
        return '@all'
    }
    const userIdTmp = touser.split('|')
    let userId = ''
    for (let i = 0; i < userIdTmp.length; i++) {
        userId = pinUserMap[pin]
        if (userId) break
    }
    if (!userId) {
        userId = touser
    }
    return userId
}

module.exports = sendQYWXAMNotice
