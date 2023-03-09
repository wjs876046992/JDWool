/**
 *
 * cron: 2 0 * * * jd_users.js 获取用户信息
 */

const Env = require('./common/Env')
const $ = new Env('获取用户信息')
// const notify = $.isNode() ? require('./dep/SendNotify') : ''
//Node.js用户请在jdCookie.js处填写京东ck
const jdCookieNode = $.isNode() ? require('./dep/jdCookie') : ''
const callAPI = require('./common/ApiCaller')
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = []

const { getUserInfo, updateUserInfo } = require('./dep/UserInfo')
const forceUpdate = process.env.FORCE_UPDATE_USER || false

!(async () => {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })

    const UserInfo = getUserInfo()
    for (let i = 0; i < cookiesArr.length; i++) {
        const cookie = cookiesArr[i]
        const pin = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
        if (forceUpdate || !UserInfo[pin] || !UserInfo[pin]["nickname"]) {
            // 查找昵称
            const user = {
                ...(UserInfo[pin] || {})
            }
            const ret = await QueryJDUserInfo(cookie, $.getUA())
            if (!ret.isLogin) {
                continue
            }
            user.nickname = ret.nickname
            user.updateTime = $.time("yyyy-MM-dd HH:mm:ss")
            console.log(JSON.stringify(user))
            UserInfo[pin] = user

            await $.wait($.randomWaitTime(1, 3))
        }
    }
    updateUserInfo(UserInfo)

})()
async function QueryJDUserInfo(cookie, ua) {
    const options = {
        "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
        "headers": {
            "Accept": "application/json,text/plain, */*",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-cn",
            "Connection": "keep-alive",
            "Cookie": cookie,
            "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
            "User-Agent": ua
        }
    }
    const ret = await callAPI(options)
    if (ret.code !== 0) {
        return console.log(ret.errMsg)
    }

    const data = ret.data
    // console.log(JSON.stringify(data))
    return {
        isLogin: data['retcode'] !== 13,
        nickname: data['retcode'] === 0 && (data['base'].nickname || data['base'].curPin)
    }
}
