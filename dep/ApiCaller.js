/* eslint-disable eqeqeq */
const Env = require('./Env')
const $ = new Env()

function callback(resolve) {
    return (err, resp, data) => {
        const ret = {
            code: 0,
            data: null,
            errMsg: null
        }
        if (err) {
            ret.code = -1001
            ret.errMsg = JSON.stringify(err)
        }
        if (!data) {
            ret.code = -1002
            ret.errMsg = '服务器返回空数据'
        }
        if (typeof data == 'object' && Object.keys(data).length > 0) {
            ret.data = data
        } else {
            ret.data = $.jsonParse(data)
        }
        // console.log(JSON.stringify(ret) + '\n\n\n')
        resolve(ret)
    }
}

function callAPI(options) {
    options.timeout = options.timeout || process.env.API_TIMEOUT || 15000
    return options.method === 'post' ?
        new Promise(resolve => {
            $.post(options, callback(resolve))
        })
        :
        new Promise(resolve => {
            $.get(options, callback(resolve))
        })
}


module.exports = callAPI