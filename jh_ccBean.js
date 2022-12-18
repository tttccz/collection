/*
[task_local]
# 建行CC豆每日任务
15 8 * * * jh_ccBean.js, tag=建行CC豆每日任务, enabled=true
搜event.ccbft.com，请求头的zhcToken，设置JHCC_TOKENS，几小时就会过期，一天抓一次即可 多账号@分割 
*/
const $ = new Env('建行CC豆每日任务');
// const notify = $.isNode() ? require('./sendNotifySp') : '';
if (process.env.JHCC_TOKENS) {
    if (process.env.JHCC_TOKENS.indexOf('@') > -1) {
        cookieArr = process.env.JHCC_TOKENS.split('@');
    } else if (process.env.JHCC_TOKENS.indexOf('\n') > -1) {
        cookieArr = process.env.JHCC_TOKENS.split('\n');
    } else {
        cookieArr = [process.env.JHCC_TOKENS];
    }
} else {
    console.log('未发现有效Cookie，请填写JHCC_TOKENS!')
    return
}

console.log(`\n==========共发现${cookieArr.length}个账号==========\n`)
$.index = 0
$.message = ''
!(async () => {
    for (let i = 0; i < cookieArr.length; i++) {
        cookie = cookieArr[i]
        $.redualWater = 0
        $.stealStatus = true
        if (cookie.indexOf('&') > -1) {
            $.zhcToken = cookie.split('&')[0]
            $.remark = cookie.split('&')[1]
        } else {
            $.zhcToken = cookie
            $.remark = '匿名用户'
        }
        console.log(`\n🔄 当前进行第${i + 1}个账号，用户备注：${$.remark}`)
        await getUser()
        await getUserState()
        while ($.needGrowthExp == 0) {
            await upgradeUser()
            await $.wait(1000)
            await getUserState()
            await $.wait(1000)
        }
        console.log(`\n========每日奖励========\n`)
        if ($.levelReceiveResult === false) {
            console.log(`⏰ 去领取每日奖励`)
            await receiveLevelReward()
            await $.wait(1000)
        } else {
            console.log(`⏰ 每日奖励已领取~`)
        }
        console.log(`\n========签到任务========\n`)
        await getUserInfo()
        if ($.signStatus == false) {
            await signIn()
            await $.wait(1000)
            await getUserInfo()
            console.log(`✅ 签到成功，已连续签到${$.currentDay}天`)
        } else {
            console.log(`✅ 已经完成过签到任务了，已连续签到${$.currentDay}天`)
        }
        console.log(`\n========每日任务========\n`)
        await getTaskList()
        for (let taskInfo of $.taskList) {
            $.taskId = taskInfo.id
            isComplete = taskInfo.taskDetail.completeStatus == '02' ? true : false
            if (isComplete == false) {
                console.log(`⏰ 去完成任务：${taskInfo.taskName}`)
                await browseTask()
                await $.wait(2000)
                await receiveReward()
            } else {
                console.log(`✅ 已完成任务：${taskInfo.taskName}`)
            }
        }
        console.log(`\n========资产统计========\n`)
        await getUserState()
        await getUserCCD()
    }

})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })

function getUserState() {
    let url = 'https://event.ccbft.com/api/businessCenter/mainVenue/getUserState?zhc_token='
    let body = {

    }
    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {
                    $.level = dataObj.data.level
                    $.growthExp = dataObj.data.growthExp
                    $.needGrowthExp = dataObj.data.needGrowthExp
                    $.levelRewardId = dataObj.data.zhcRewardInfo.id
                    $.levelRewardValue = dataObj.data.zhcRewardInfo.rewardValue
                    $.levelRewardName = dataObj.data.zhcRewardInfo.rewardName
                    $.levelRewardType = dataObj.data.zhcRewardInfo.rewardType
                    $.levelReceiveResult = dataObj.data.receiveResult == '00' ? true : false
                    console.log(`✨ ${$.levelRewardName}，当前经验值${$.growthExp}，升至下一级还需${$.needGrowthExp}经验`)
                    if ($.needGrowthExp == 0) {
                        console.log(`🎯 当前等级经验已满`)
                    }
                } else {
                    console.log("💥 获取用户状态失败！")
                    $.stop = true
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function upgradeUser() {
    let url = 'https://event.ccbft.com/api/businessCenter/mainVenue/upgradeUser?zhc_token='
    let body = {
        "userId": $.userId
    }
    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {

                    console.log(`✅ 升级成功：${dataObj.data.rewardName}`)
                } else {
                    console.log("💥 获取用户信息失败！")
                    $.stop = true
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function getUser() {
    let url = 'https://event.ccbft.com/api/businessCenter/user/getUser?zhc_token='
    let body = {
    }
    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {
                    $.userId = dataObj.data.userDTO.userId
                    $.mobile = dataObj.data.userDTO.mobile
                    console.log(`✅ 当前登录人手机号：${$.mobile}\n🎟️ 用户UserId：${$.userId}`)
                } else {
                    console.log("💥 获取用户信息失败！")
                    $.stop = true
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

// function getLevelReward() {
//     let url = 'https://event.ccbft.com/api/businessCenter/mainVenue/getLevelReward?zhc_token='
//     let body = {
//         "level": $.level
//     }

//     let myRequest = getPostRequest(url, body);
//     return new Promise(async resolve => {
//         $.post(myRequest, (err, resp, data) => {
//             try {
//                 dataObj = JSON.parse(data)
//                 if (dataObj.success === true) {
//                     console.log(`✅ 领取每日奖励成功 +${dataObj.data.rewardValue}CC豆`)
//                 } else {
//                     console.log("💥 领取每日奖励失败！")
//                 }
//             } catch (e) {
//                 // console.log(data);
//                 console.log(e, resp)
//             } finally {
//                 resolve();
//             }
//         })
//     })
// }

function receiveLevelReward() {
    let url = 'https://event.ccbft.com/api/businessCenter/mainVenue/receiveLevelReward?zhc_token='
    let body = {
        "levelRewardType": $.levelRewardType,
        "level": $.level,
        "userId": $.userId,
        "rewardId": $.levelRewardId
    }

    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {
                    console.log(`✅ 领取每日奖励成功 +${$.levelRewardValue}CC豆`)
                } else {
                    console.log("💥 领取每日奖励失败！")
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function getUserCCD() {
    let url = 'https://event.ccbft.com/api/businessCenter/user/getUserCCD?zhc_token='
    let body = {
    }

    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {
                    $.userCCBeanInfo = dataObj.data.userCCBeanInfo
                    $.userCCBeanExpiredInfo = dataObj.data.userCCBeanExpiredInfo
                    console.log(`💰 当前账户：${$.userCCBeanInfo.count}CC豆\n⏰ 将有${$.userCCBeanExpiredInfo.count}豆于${$.userCCBeanExpiredInfo.expireDate}过期`)
                } else {
                    console.log("💥 获取用户资产失败！")
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function getUserInfo() {
    let url = 'https://event.ccbft.com/api/businessCenter/taskCenter/getUserInfo?zhc_token='
    let body = {
    }

    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {
                    $.signId = dataObj.data.taskId
                    $.signStatus = dataObj.data.signTaskState == "01" ? true : false
                    $.currentDay = dataObj.data.currentDay
                } else {
                    console.log("💥 获取用户签到信息失败！")
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function signIn() {
    let url = 'https://event.ccbft.com/api/businessCenter/taskCenter/signin?zhc_token='
    let body = {
    }

    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {
                    console.log(`✅ ${dataObj.message}`)
                } else {
                    console.log(`💥 ${dataObj.message}`)
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function getTaskList() {
    let url = 'https://event.ccbft.com/api/businessCenter/taskCenter/getTaskList?zhc_token='
    let body = {
        "publishChannels": "01",
        "regionId": $.regionId
    }

    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {
                    console.log(`✅ 获取任务列表成功！`)
                    $.taskList = dataObj.data['浏览任务']
                } else {
                    console.log("💥 获取任务列表失败！")
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function browseTask() {
    let url = 'https://event.ccbft.com/api/businessCenter/taskCenter/browseTask?zhc_token='
    let body = {
        "taskId": $.taskId,
        "browseSec": 1
    }

    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {
                    console.log(`✅ ${dataObj.message}`)
                } else {
                    console.log(`💥 ${dataObj.message}`)
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function receiveReward() {
    let url = 'https://event.ccbft.com/api/businessCenter/taskCenter/receiveReward?zhc_token='
    let body = {
        "taskId": $.taskId
    }

    let myRequest = getPostRequest(url, body);
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                dataObj = JSON.parse(data)
                if (dataObj.success === true) {
                    console.log(`✅ ${dataObj.message}`)
                } else {
                    console.log(`💥 ${dataObj.message}`)
                }
            } catch (e) {
                // console.log(data);
                console.log(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function getPostRequest(url, body, method = "POST") {
    let headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "User-Agent": $.UA,
        "Content-Type": "application/json;charset=UTF-8",
        "Host": "event.ccbft.com",
        "zhc_token": $.zhcToken
    }
    return { url: url, method: method, headers: headers, body: JSON.stringify(body), timeout: 30000 };
}

function uuid(x = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx") {
    return x.replace(/[xy]/g, function (x) {
        const r = 16 * Math.random() | 0, n = "x" === x ? r : 3 & r | 8;
        return n.toString(36)
    })
}

// prettier-ignore
function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
