let client
const oc = {}

const Cache = (c) => {
    client = c
    client.on("error", function(err) {
        console.log(err)
    })

    return oc
}

const get = (key) => {
    return new Promise((resolve) => {
        client.get(key, function(err, res) {
            resolve(JSON.parse(res))
        })
    })
}

oc.set = function(key, value) {
    return new Promise((resolve) => {
        value = JSON.stringify(value)
        client.set(key, value, function(err) {
            if (err) {
                console.error(err)
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

oc.get = (key) => {
    return get(key)
}


oc.hset = function(key, field, value) {
    return new Promise((resolve) => {
        value = JSON.stringify(value)
        client.hset(key, field, value, function(err) {
            if (err) {
                console.error(err)
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

function hget(key, field) {
    return new Promise((resolve) => {
        client.hget(key, field, function(err, res) {
            resolve(res && JSON.parse(res))
        })
    })
}

oc.hget = (key, field) => {
    return hget(key, field)
}

oc.expire = function(key, time) {
    return new Promise((resolve) => {
        client.expire(key, time)
        resolve(true)
    })
}

oc.exists = function(key) {
    return new Promise((resolve) => {
        const ret = client.exists(key)
        resolve(ret > 0)
    })
}

module.exports = Cache