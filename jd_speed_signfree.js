/*
  入口>京东极速版>首页>签到免单
  京东极速版,先下单,第二天开始签到
  18 8,14,20 * * * jd_speed_signfree.js 签到免单
*/
const Env = require('./dep/Env')
const $ = new Env('京东极速版签到免单');
const notify = $.isNode() ? require('./dep/SendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./dep/jdCookie') : '';
const UA = $.isNode()
    ? (process.env.JS_USER_AGENT
        ? process.env.JS_USER_AGENT : (require('./dep/JS_USER_AGENTS').USER_AGENT)) : ($.getdata('JSUA')
        ? $.getdata('JSUA')
        : "'jdltapp;iPad;3.1.0;14.4;network/wifi;Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
    cookie,
    msg = [],
    first_flag,
    wxNoticeErr = []

const activityId = 'PiuLvM8vamONsWzC0wqBGQ'

if ($.isNode()) {
    console.log('\n入口>京东极速版>首页>签到免单')
    console.log('京东极速版,先下单,第二天开始签到')
    console.log('请自行测试是否有效！！！')
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
    };
} else {
    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/';
!(async () => {
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
            $.index = i + 1;
            $.nickName = '';
            console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
            msg.push(($.nickName || $.UserName) + ':')
            first_flag = true
            await sign_all()
        }
    }
    if (msg.length) {
        await notify.sendNotify($.name, msg.join('\n'))
    }
    if (wxNoticeErr.length) {
        const sendWXNotice = $.isNode() ? require('./dep/WXLovelyCat_Notify') : false
        wxNoticeErr.unshift($.name)
        sendWXNotice && sendWXNotice(wxNoticeErr.join('\n'))
    }
})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
        notify.sendNotify($.name + '异常!!', msg.join('\n') + '\n' + e)
    })
    .finally(() => {
        $.msg($.name, '', `结束`);
        $.done();
    })

async function sign_all() {
    await query()
    if (!$.signFreeOrderInfoList) {
        return
    }
    await $.wait(3000)
    for (const order of $.signFreeOrderInfoList) {
        // console.debug('now:', order)
        $.productName = order.productName
        await sign(order.orderId)
        await $.wait(3000)
    }
    await $.wait(3000)
    await query()
    await $.wait(3000)
    for (const order of $.signFreeOrderInfoList) {
        // console.debug('2nd now:', order)
        if (order.needSignDays === order.hasSignDays) {
            console.log(order.productName, '可提现,执行提现')
            $.productName = order.productName
            await cash(order.orderId)
            await $.wait(3000)
        }
    }
}

function query() {
    return new Promise(resolve => {
        $.get(taskGetUrl("signFreeHome", {"linkId": activityId}), async (err, resp, data) => {
            try {
                if (err) {
                    console.error(`${JSON.stringify(err)}`)
                    wxNoticeErr.push(($.nickName || $.UserName) + ':')
                    wxNoticeErr.push('查询待签到商品列表失败，请检查脚本并重新执行')
                    return
                }
                // console.debug('query:', data)
                data = JSON.parse(data)
                $.signFreeOrderInfoList = data.data.signFreeOrderInfoList
                if (!data.success) {
                    console.error("失败")
                    // wxNoticeErr.push('未查询到待签到列表，请检查脚本并重新执行')
                    return
                }
                if (!data.data.signFreeOrderInfoList) {
                    console.log("没有需要签到的商品,请到京东极速版[签到免单]购买商品")
                    msg.push("没有需要签到的商品,请到京东极速版[签到免单]购买商品")
                    return
                }
                $.signFreeOrderInfoList = data.data.signFreeOrderInfoList
                if (first_flag) {
                    first_flag = false
                    console.log("脚本也许随时失效,请注意")
                    msg.push("脚本也许随时失效,请注意")
                    if (data.data.risk) {
                        console.log("风控用户,可能有异常")
                        msg.push("风控用户,可能有异常")
                        // wxNoticeErr.push('风控用户，可能有异常')
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
                wxNoticeErr.push(($.nickName || $.UserName) + ':')
                wxNoticeErr.push($.UserName + ': 接口query请求失败，请检查脚本')
            } finally {
                resolve(data);
            }
        })
    })
}

function sign(orderId) {
    return new Promise(resolve => {
        // console.debug('sign orderId:', orderId)
        $.post(taskPostUrl("signFreeSignIn", {"linkId": activityId, "orderId": orderId}), async (err, resp, data) => {
            try {
                if (err) {
                    console.error(`${JSON.stringify(err)}`)
                    wxNoticeErr.push(($.nickName || $.UserName) + ':')
                    wxNoticeErr.push('签到失败，请检查脚本')
                    return
                }
                // console.debug('sign:', data)
                data = JSON.parse(data)
                let msg_temp
                if (data.success) {
                    msg_temp = $.productName + ' 签到成功'
                } else {
                    msg_temp = $.productName + ' ' + (data.errMsg || '未知错误')
                    wxNoticeErr.push(($.nickName || $.UserName) + ':')
                    wxNoticeErr.push(msg_temp)
                }
                console.log(msg_temp)
                msg.push(msg_temp)
            } catch (e) {
                $.logErr(e, resp)
                wxNoticeErr.push(($.nickName || $.UserName) + ':')
                wxNoticeErr.push($.UserName + ': 接口sign请求失败，请检查脚本')
            } finally {
                resolve(data);
            }
        })
    })
}

function cash(orderId) {
    return new Promise(resolve => {
        // console.debug('cash orderId:', orderId)
        $.post(taskPostUrl("signFreePrize", {
            "linkId": activityId,
            "orderId": orderId,
            "prizeType": 2
        }), async (err, resp, data) => {
            try {
                if (err) {
                    console.error(`${JSON.stringify(err)}`)
                    wxNoticeErr.push(($.nickName || $.UserName) + ':')
                    wxNoticeErr.push('提现失败，请检查脚本')
                    return
                }
                // console.debug('cash:', data)
                data = JSON.parse(data)
                let msg_temp
                if (data.success) {
                    msg_temp = $.productName + ' 提现成功'
                } else {
                    msg_temp = $.productName + ' ' + (data.errMsg || '未知错误')
                    wxNoticeErr.push(($.nickName || $.UserName) + ':')
                    wxNoticeErr.push(msg_temp)
                }
                console.log(msg_temp)
                msg.push(msg_temp)
            } catch (e) {
                $.logErr(e, resp)
                wxNoticeErr.push(($.nickName || $.UserName) + ':')
                wxNoticeErr.push($.UserName + ': 接口cash请求失败，请检查脚本')
            } finally {
                resolve(data);
            }
        })
    })
}

function taskPostUrl(function_id, body) {
    return {
        url: `${JD_API_HOST}`,
        body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&_t=${new Date()}&appid=activities_platform`,
        headers: {
            'Cookie': cookie,
            'Host': 'api.m.jd.com',
            // 'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            "User-Agent": UA,
            'accept-language': 'en-US,zh-CN;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            "referer": "https://signfree.jd.com/?activityId=" + activityId
        }
    }
}

function taskGetUrl(function_id, body) {
    return {
        url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&_t=${new Date()}&appid=activities_platform`,
        headers: {
            'Cookie': cookie,
            'Host': 'api.m.jd.com',
            'Accept': 'application/json, text/plain, */*',
            'origin': 'https://signfree.jd.com',
            // 'Connection': 'keep-alive',
            'user-agent': UA,
            'accept-language': 'en-US,zh-CN;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            "referer": "https://signfree.jd.com/?activityId=" + activityId
        }
    }
}

function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}

function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}
