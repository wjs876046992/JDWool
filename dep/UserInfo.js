const fs = require("fs")
const filePath = "./data/users.json"

function getUserInfo() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]")
    }
    const op = { encoding: "utf8" }
    const data = fs.readFileSync(filePath, op).toString() || "{}"
    return  JSON.parse(data)
}

function updateUserInfo(users) {
    fs.writeFileSync(filePath, JSON.stringify(users))
}

module.exports = {
    getUserInfo, updateUserInfo
}