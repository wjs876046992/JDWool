/* eslint-disable eqeqeq */
const sendQYWXAMNotice = require("./QYWX_Notify")

// const sendWXNotice = require("./WXLovelyCat_Notify")

async function sendNotify(title, content, summary = 'Herman Wu', pin = '') {
    // 由于上述两种微信通知需点击进去才能查看到详情，故title(标题内容)携带了账号序号以及昵称信息，方便不点击也可知道是哪个京东哪个活动
    title = title.match(/.*?(?=\s?-)/g) ? title.match(/.*?(?=\s?-)/g)[0] : title
    await Promise.all([
        sendQYWXAMNotice(pin, title, content, summary), // 企业微信应用消息推送
        // sendWXNotice(title, content, summary)
    ])
}

module.exports = {
    sendNotify
}