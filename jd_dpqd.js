/**
 * cron 12 12 29 2 ? jd_dpqd.js
 * 店铺签到，店铺Token默认从本地环境变量DPQDTK中获取
 *
 * Fix by HermanWu
 * TG: https://t.me/HarbourToulu
 *
 * 环境变量:
 * DPQDTK: token1&token2
 *
 */

let token = []
if (process.env.DPQDTK) {
    if (process.env.DPQDTK.includes('\n')) {
        token = [...process.env.DPQDTK.split('\n'), ...token]
    } else {
        token = [...process.env.DPQDTK.split('&'), ...token]
    }
}
if (!token.length) {
    console.log('无本地店铺签到token, 结束运行')
    return
}
console.log(token)

const Env = require('./dep/Env')
const $ = new Env('店铺签到')
const notify = $.isNode() ? require('./dep/SendNotify') : ''
//Node.js用户请在jdCookie.js处填写京东ck
const jdCookieNode = $.isNode() ? require('./dep/jdCookie') : ''
const runAccountNum = process.env.DPQD_RUN_NUM || 5
const {getUserInfo} = require('./dep/UserInfo')
const callAPI = require('./dep/ApiCaller')

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message = []
const JD_API_HOST = 'https://api.m.jd.com/api', messages = [], validTokens = [], expiredTokens = []

if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
} else {
    let cookiesData = $.getdata('CookiesJD') || "[]"
    cookiesData = $.jsonParse(cookiesData)
    cookiesArr = cookiesData.map(item => item.cookie)
    cookiesArr.reverse()
    cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')])
    cookiesArr.reverse()
    cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined)
}

!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"})
        return
    }

    const UserInfo = getUserInfo()
    for (let i = 0; i < runAccountNum; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i]
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
            $.index = i + 1
            $.nickName = (UserInfo[$.UserName] && UserInfo[$.UserName].nickname) || $.UserName
            await dpqd()
            if (i === 0 && expiredTokens.length > 0) {
                // 第一个账号结束后，清理过期token
                const sendWXNotice = $.isNode() ? require('./dep/WXLovelyCat_Notify') : false
                sendWXNotice && sendWXNotice(`dpqdql ${expiredTokens.join("&")}`)
            }
            console.log(message.join('\n'), '\n')
            await $.wait($.randomWaitTime(1, 3))
        }
    }
    await notify.sendNotify($.name, messages.join('\n'))
})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done()
    })

//开始店铺签到
async function dpqd() {
    message = []
    const tks = $.index === 1 ? token : validTokens
    if (tks.length === 0) {
        return
    }
    message.push(`\n******开始【京东账号${$.index}】${$.nickName}*********\n`)
    for (let j = 0; j < tks.length; j++) {
        const tk = tks[j]
        if (!tk) {
            continue
        }
        message.push(`【第${j + 1}个店铺签到活动】`)
        const {venderId, activityId} = await getActivityInfo(tk)
        if (!venderId) {
            message.push(`活动状态：已失效`)
            expiredTokens.push(tk)
            continue
        }
        const shopName = await getVenderName(venderId)
        message.push(`店铺名称：【${shopName}】`)
        // const activityId = await getActivityInfo(tk, venderId)
        await signCollectGift(tk, venderId, activityId)
        const signDays = await getSignRecord(tk, venderId, activityId)
        message.push(`总共签到: ${signDays}天`)
        if (!signDays) {
            expiredTokens.push(tk)
        }
        // 过期token未找到，有效token未找到，则加入到有效token
        if (expiredTokens.indexOf(tk) === -1 && validTokens.indexOf(tk) === -1) {
            validTokens.push(tk)
        }
    }
    message.push('\n')
    messages.push(...message)
}

//获取店铺ID
async function getActivityInfo(token) {
    const body = `{"token": "${token}"}`.replaceAll("\"", "%22")
    const data = await call(arguments.callee.name, body, 'jsonp1000')
    if (!data.success || data.code === 402) {
        return false
    } else {
        message.push(`活动内容: `)
        for (let i = 0; i < data.data.continuePrizeRuleList.length; i++) {
            const userPrizeRuleStatus = data.data.continuePrizeRuleList[i].userPrizeRuleStatus
            let userPrizeRuleStatusText
            if (userPrizeRuleStatus === 3) {
                userPrizeRuleStatusText = '是否达标：已达标未抢到'
            } else if (userPrizeRuleStatus === 1) {
                userPrizeRuleStatusText = '是否达标：未达标'
            } else if (userPrizeRuleStatus === 2) {
                userPrizeRuleStatusText = '是否达标：已达标已领取'
            } else {
                message.push(`userPrizeRuleStatus: ${userPrizeRuleStatus}`)
                userPrizeRuleStatusText = '是否达标：???'
            }
            const days = data.data.continuePrizeRuleList[i].days
            const prize = data.data.continuePrizeRuleList[i].prizeList[0]
            const discount = prize.discount
            const type = prize.type
            let awardName
            if (type === 6) {
                awardName = '积分'
            } else if (type === 1) {
                awardName = '优惠券'
            } else if (type === 4) {
                awardName = '京豆'
            }  else if (type === 9) {
                const interactPrizeSku = prize.interactPrizeSkuList[0]
                awardName = `${interactPrizeSku.skuName}, 原价: ${interactPrizeSku.jdPrice}元, 折扣价${interactPrizeSku.promoPrice}元`
            } else {
                message.push(`type: ${type}`)
                awardName = '奖品种类：???'
            }
            let awardType
            const prizeStatus = prize.status
            if (prizeStatus === 5) {
                awardType = '库存：无'
            } else if (prizeStatus === 2) {
                awardType = '库存：有'
            } else {
                message.push(`prizeStatus: ${prizeStatus}`)
                awardType = '库存：???'
            }
            const mes = `签到${days}天, 获得${discount}${awardName}, ${userPrizeRuleStatusText}, ${awardType}`
            message.push(mes)
        }

        return {
            venderId: data.data.venderId,
            activityId: data.data.id,
        }
    }
}

//获取店铺名称
async function getVenderName(venderId) {
    const options = {
        url: `https://wq.jd.com/mshop/QueryShopMemberInfoJson?venderId=${venderId}`,
        headers: {
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
            "cookie": cookie,
            "referer": `https://h5.m.jd.com`,
            "User-Agent": $.getUA()
        }
    }
    const ret = await callAPI(options)
    if (ret.code !== 0) {
        return ''
    }
    const data = ret.data
    // console.debug(arguments.callee.name, JSON.stringify(data) + '\n')
    // if (!data.shopName) {
    //     console.debug(arguments.callee.name, JSON.stringify(data))
    // }
    return data.shopName || ''
}

//店铺签到
async function signCollectGift(token, venderId, activityId) {
    const body = escapeBody({token, venderId, activityId, type: 56, actionType: 7})
    const data = await call(arguments.callee.name, body, 'jsonp1004')
    if (data.code === 404130026) {
        message.push(`签到状态: 今日已签到`)
    }
}

//店铺获取签到信息
async function getSignRecord(token, venderId, activityId) {
    const body = escapeBody({token, venderId, activityId})
    const data = await call(arguments.callee.name, body, 'jsonp1006')
    return data.data.days || 0
}

async function call(functionId, body, jsonp) {
    const params = {
        appid: 'interCenter_shopSign',
        functionId: `interact_center_shopSign_${functionId}`,
        body,
        loginType: 2,
        jsonp,
        t: Date.now()
    }

    const options = {
        url: `${JD_API_HOST}?${$.serializeQueryParams(params, false)}`,
        headers: {
            "accept": "accept",
            "accept-encoding": "gzip, deflate",
            "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
            "cookie": cookie,
            "referer": `https://h5.m.jd.com`,
            "User-Agent": $.getUA()
        }
    }
    const ret = await callAPI(options)
    // console.debug(ret.data + '\n')

    if (ret.code !== 0) {
        return
    }

    return JSON.parse(/{(.*)}/g.exec(ret.data)[0])
}

function escapeBody(body) {
    const arr = []
    for (const key in body) {
        arr.push(`"${key}":"${body[key]}"`)
    }
    return `{${arr.join(",")}}`.replaceAll("\"", "%22")
}