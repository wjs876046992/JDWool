'use strict'

const got = require('got')
require('dotenv').config()
const {readFile} = require('fs/promises')
const fs = require('fs')

const api = got.extend({
    prefixUrl: 'http://127.0.0.1:5600',
    retry: {limit: 0},
})

const fileExists = fs.existsSync('/ql/data/config/auth.json')
let authFile
if (fileExists)
    authFile = "/ql/data/config/auth.json"
else {
    authFile = "/ql/config/auth.json"
}

async function getToken() {
    const text = await readFile(authFile)
    const authConfig = JSON.parse(text.toString())
    return authConfig.token
}

module.exports.getEnvs = async (searchValue = 'JD_COOKIE') => {
    const token = await getToken()
    const body = await api({
        url: 'api/envs',
        searchParams: {
            searchValue,
            t: Date.now(),
        },
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
        },
    }).json()
    return body.data
}

module.exports.getFirstEnv = async (searchValue = 'JD_COOKIE') => {
    const token = await getToken()
    const body = await api({
        url: 'api/envs',
        searchParams: {
            searchValue,
            t: Date.now(),
        },
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
        },
    }).json()
    return body.data.length ? body.data[0] : null
}

module.exports.getEnvsCount = async () => {
    const data = await this.getEnvs()
    return data.length
}

module.exports.addEnv = async (name, value, remarks) => {
    const token = await getToken()
    const body = await api({
        method: 'post',
        url: 'api/envs',
        params: {t: Date.now()},
        json: [{
            name: name || 'JD_COOKIE',
            value,
            remarks,
        }],
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json;charset=UTF-8',
        },
    }).json()
    return body
}

module.exports.updateEnv = async (env) => {
    const token = await getToken()
    const { _id, id, name, value, remarks } = {...env}
    let newEnv
    if (_id) {
        newEnv = {
            _id, name, value, remarks
        }
    } else {
        newEnv = {
            id, name, value, remarks
        }
    }
    const body = await api({
        method: 'put',
        url: 'api/envs',
        params: {t: Date.now()},
        json: newEnv,
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json;charset=UTF-8',
        },
    }).json()
    return body
}

module.exports.disableEnv = async (eid) => {
    const token = await getToken()
    const body = await api({
        method: 'put',
        url: 'api/envs/disable',
        params: {t: Date.now()},
        body: JSON.stringify([eid]),
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json;charset=UTF-8',
        },
    }).json()
    return body
}

module.exports.enableEnv = async (eid) => {
    const token = await getToken()
    const body = await api({
        method: 'put',
        url: 'api/envs/enable',
        params: {t: Date.now()},
        body: JSON.stringify([eid]),
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json;charset=UTF-8',
        },
    }).json()
    return body
}

module.exports.getEnvStatus = async (eid) => {
    const envs = await this.getEnvs()
    let tempId = 0
    for (let i = 0; i < envs.length; i++) {
        tempId = 0
        if (envs[i]._id) {
            tempId = envs[i]._id
        }
        if (envs[i].id) {
            tempId = envs[i].id
        }
        if (tempId === eid) {
            return envs[i].status
        }
    }
    return 99
}

module.exports.getEnvById = async (eid) => {
    const envs = await this.getEnvs()
    let tempId = 0
    for (let i = 0; i < envs.length; i++) {
        tempId = 0
        if (envs[i]._id) {
            tempId = envs[i]._id
        }
        if (envs[i].id) {
            tempId = envs[i].id
        }
        if (tempId === eid) {
            return envs[i].value
        }
    }
    return ""
}

module.exports.getEnvByPtPin = async (PtPin) => {
    const envs = await this.getEnvs()
    for (let i = 0; i < envs.length; i++) {
        let tempPtPin = decodeURIComponent(envs[i].value.match(/pt_pin=([^; ]+)(?=;?)/) && envs[i].value.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        if (tempPtPin === PtPin) {
            return envs[i]
        }
    }
    return ""
}

module.exports.delEnv = async (eid) => {
    const token = await getToken()
    const body = await api({
        method: 'delete',
        url: 'api/envs',
        params: {t: Date.now()},
        body: JSON.stringify([eid]),
        headers: {
            Accept: 'application/json',
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json;charset=UTF-8',
        },
    }).json()
    return body
}