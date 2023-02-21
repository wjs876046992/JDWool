const fs = require("fs")
const dir = './dep/data'
const filePath = `${dir}/users.json`

function getUserInfo() {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "{}")
    }
    const op = { encoding: "utf8" }
    const data = fs.readFileSync(filePath, op).toString() || "{}"
    return JSON.parse(data)
}

function updateUserInfo(users) {
    fs.writeFileSync(filePath, JSON.stringify(users))
}

module.exports = {
    getUserInfo, updateUserInfo
}