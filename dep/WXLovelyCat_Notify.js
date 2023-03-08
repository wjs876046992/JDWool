// 可爱猫通知对接
const request = require('request')
const OPEN_WX_NOTICE = (process.env.OPEN_WX_NOTICE && JSON.parse(process.env.OPEN_WX_NOTICE)) || false

if (!OPEN_WX_NOTICE) {
    console.log(`export OPEN_WX_NOTICE="true"开启微信通知`)
}

const sendWXNotice = async (msg, to_wxids) => {

    if (!OPEN_WX_NOTICE) {
        return
    }
    const kam_addr = process.env.KAM_ADDR || ''
    const kam_wxid = process.env.KAM_BOT_ID || ''
    const kam_token = process.env.KAM_TOKEN || ''
    to_wxids = to_wxids || (process.env.WX_MASTERS && process.env.WX_MASTERS.split(','))

    if (!msg || !kam_addr || !kam_wxid || !to_wxids || to_wxids.length === 0) {
        console.log(msg, kam_addr, kam_wxid, kam_token, JSON.stringify(to_wxids))
        console.log(`微信参数配置错误，取消发送`)
        return
    }
    for (let i = 0, j = to_wxids.length; i < j; i++) {
        const options = {
            'method': 'POST',
            'url': kam_addr,
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': kam_token
            },
            body: JSON.stringify({
                'event': 'SendTextMsg',
                'robot_wxid': kam_wxid,
                'to_wxid': to_wxids[i],
                'msg': `${msg}`
            })
        }
        try {
            request(options)
            await sleep(2000)
        } catch (e) {
            console.log(`发送WeChat失败`)
        }
    }
}
function sleep(duration) {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    })
}

module.exports = sendWXNotice