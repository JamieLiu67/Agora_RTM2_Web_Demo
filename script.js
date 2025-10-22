
// ===============================
// Agora RTM 2.x Web Demo 示例
// 适合 RTM 初学者快速上手、参考学习
// ===============================


// RTM 实例、当前用户、当前频道、频道用户列表
let rtm = null;
let currentUserId = '';
let currentChannel = '';
let userList = [];


// 页面元素获取
const appIdInput = document.getElementById('appIdInput');
const userIdInput = document.getElementById('userIdInput');
const channelInput = document.getElementById('channelInput');
const tokenInput = document.getElementById('tokenInput');

// 控制需登录后显示的功能区显示/隐藏
function setRTMFeatureVisible(visible, transitionDuration = 300) {
    // 使用CSS类切换而不是直接修改style，更好的性能和可维护性
    document.querySelectorAll('.rtm-feature').forEach(el => {
        if (visible) {
            // 先设置display，然后添加淡入效果
            el.style.display = '';
            el.style.opacity = '0';
            // 强制回流
            void el.offsetWidth;
            el.style.transition = `opacity ${transitionDuration}ms ease`;
            el.style.opacity = '1';
        } else {
            // 淡出然后隐藏
            el.style.opacity = '0';
            setTimeout(() => {
                el.style.display = 'none';
            }, transitionDuration);
        }
    });
}
// 初始化时立即隐藏，不使用动画
document.querySelectorAll('.rtm-feature').forEach(el => el.style.display = 'none');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const subscribeBtn = document.getElementById('subscribeBtn');
const unsubscribeBtn = document.getElementById('unsubscribeBtn');
const messageInput = document.getElementById('messageInput');
const sendP2PBtn = document.getElementById('sendP2PBtn');
const channelMsgInput = document.getElementById('channelMsgInput');
const sendChannelMsgBtn = document.getElementById('sendChannelMsgBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
clearLogBtn.onclick = () => {
    logArea.innerHTML = '';
};
const messageArea = document.getElementById('messageArea');
const clearMsgBtn = document.getElementById('clearMsgBtn');
clearMsgBtn.onclick = () => {
    messageArea.innerHTML = '';
};
const statusArea = document.getElementById('statusArea');
const userListArea = document.getElementById('userList');
const targetUserInput = document.getElementById('targetUserInput');
const logArea = document.getElementById('logArea');


// 查询用户在线相关元素
const queryUserInput = document.getElementById('queryUserInput');
const queryUserOnlineBtn = document.getElementById('queryUserOnlineBtn');

// Token 更新相关元素
const newTokenInput = document.getElementById('newTokenInput');
const renewTokenBtn = document.getElementById('renewTokenBtn');


// 呼叫邀请相关变量
const callUserInput = document.getElementById('callUserInput');
const sendCallInviteBtn = document.getElementById('sendCallInviteBtn');
let callInviteTimer = null;      // 呼叫邀请弹窗倒计时定时器
let callInviteDialog = null;     // 呼叫邀请弹窗 DOM
let callInviteAudio = null;      // 呼叫邀请音效播放器
let callInviteState = null;      // 呼叫邀请状态 'calling', 'waiting', 'accepted', 'denied'


// 状态区展示和日志打印
function showStatus(msg, type = 'connected') {
    statusArea.innerHTML = `<div class="status status-${type}">${msg}</div>`;
    addLog(msg);
}


// 消息区展示（频道/点对点消息）
function addMessage(content, type = 'received', time = new Date(), user = '') {
    // 只展示本地发送和远端接收的消息
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${type}`;
    msgDiv.style.wordWrap = 'break-word';
    msgDiv.style.wordBreak = 'break-all';
    msgDiv.style.whiteSpace = 'pre-wrap';
    msgDiv.style.overflowWrap = 'break-word';
    msgDiv.style.maxWidth = '100%';
    msgDiv.innerHTML = `<div>${user ? `<b>${user}:</b> ` : ''}${content}</div><div class="message-time">${time.toLocaleTimeString()}</div>`;
    messageArea.appendChild(msgDiv);
    messageArea.scrollTop = messageArea.scrollHeight;
}


// 日志区打印
function addLog(log) {
    const logDiv = document.createElement('div');
    logDiv.style.wordWrap = 'break-word';
    logDiv.style.wordBreak = 'break-all';
    logDiv.style.whiteSpace = 'pre-wrap';
    logDiv.style.overflowWrap = 'break-word';
    logDiv.style.maxWidth = '100%';
    logDiv.textContent = `[${new Date().toLocaleTimeString()}] ${log}`;
    logArea.appendChild(logDiv);
    logArea.scrollTop = logArea.scrollHeight;
}


// 刷新频道用户列表
function updateUserList(users) {
    userListArea.innerHTML = '';
    if (!users || users.length === 0) {
        userListArea.innerHTML = '<div class="user-item"><span>当前没有用户在线</span></div>';
        return;
    }
    const selfId = document.getElementById('userIdInput').value.trim();
    users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'user-item';
        let nameHtml = `<span>${u}</span>`;
        if (u === selfId) {
            nameHtml += ' <span style="color:#ff9800;font-weight:bold;">(本人)</span>';
        }
        div.innerHTML = `${nameHtml}<span class="user-online" style="margin-left:auto;">在线</span>`;
        userListArea.appendChild(div);
    });
}


// 音频播放工具（呼叫邀请相关）
function playAudio(src) {
    if (callInviteAudio) {
        callInviteAudio.pause();
        callInviteAudio.currentTime = 0;
    }
    if (src) {
        callInviteAudio = new Audio(src);
        // 处理浏览器自动播放限制问题
        const playPromise = callInviteAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // 播放成功
                console.log('音频播放成功');
            }).catch(error => {
                // 自动播放被阻止，提供用户交互提示
                console.warn('音频自动播放被阻止，需要用户交互: ', error);
                // 可以在此添加视觉提示，提醒用户点击页面以允许音频
                const audioAlert = document.createElement('div');
                audioAlert.style.position = 'fixed';
                // 计算位置：位于呼叫弹窗下方
                audioAlert.style.bottom = '40%'; // 呼叫弹窗在30%，适当下移
                audioAlert.style.left = '50%';
                audioAlert.style.transform = 'translateX(-50%)';
                audioAlert.style.background = 'rgba(0,0,0,0.7)';
                audioAlert.style.color = 'white';
                audioAlert.style.padding = '10px 20px';
                audioAlert.style.borderRadius = '5px';
                audioAlert.style.zIndex = '9999';
                audioAlert.style.cursor = 'pointer';
                audioAlert.textContent = '点击此处允许音频播放';
                audioAlert.onclick = () => {
                    callInviteAudio.play();
                    document.body.removeChild(audioAlert);
                };
                document.body.appendChild(audioAlert);
                setTimeout(() => {
                    if (document.body.contains(audioAlert)) {
                        document.body.removeChild(audioAlert);
                    }
                }, 5000);
            });
        }
    }
}

// 呼叫邀请弹窗（被叫方）
function showCallInviteDialog(fromUser) {
    closeCallInviteDialog();
    // 高斯模糊背景
    const blurBg = document.createElement('div');
    blurBg.style.position = 'fixed';
    blurBg.style.left = '0';
    blurBg.style.top = '0';
    blurBg.style.width = '100vw';
    blurBg.style.height = '100vh';
    blurBg.style.background = 'rgba(0,0,0,0.2)';
    blurBg.style.backdropFilter = 'blur(8px)';
    blurBg.style.zIndex = '9998';
    blurBg.id = 'callInviteBlurBg';
    document.body.appendChild(blurBg);
    callInviteDialog = document.createElement('div');
    callInviteDialog.style.position = 'fixed';
    callInviteDialog.style.left = '50%';
    callInviteDialog.style.top = '30%';
    callInviteDialog.style.transform = 'translate(-50%, -50%)';
    callInviteDialog.style.background = '#fff';
    callInviteDialog.style.border = '2px solid #764ba2';
    callInviteDialog.style.borderRadius = '12px';
    callInviteDialog.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    callInviteDialog.style.padding = '32px 24px';
    callInviteDialog.style.zIndex = '9999';
    callInviteDialog.innerHTML = `<div style=\"font-size:1.2rem;margin-bottom:16px;\">收到来自 <b>${fromUser}</b> 的呼叫邀请</div>`;
    // 倒计时
    const countdown = document.createElement('div');
    countdown.style.fontSize = '1rem';
    countdown.style.marginBottom = '16px';
    let timeLeft = 10;
    countdown.textContent = `剩余响应时间：${timeLeft}s`;
    callInviteDialog.appendChild(countdown);
    const timer = setInterval(() => {
        timeLeft--;
        countdown.textContent = `剩余响应时间：${timeLeft}s`;
        if (timeLeft <= 0) clearInterval(timer);
    }, 1000);
    // 按钮
    const btnAccept = document.createElement('button');
    btnAccept.className = 'btn btn-success';
    btnAccept.textContent = '接收';
    btnAccept.onclick = async () => {
        playAudio('music/accept.mp3');
        addLog('已接收呼叫邀请');
        const replyMsg = JSON.stringify({ type: 'call-accept', from: currentUserId, to: fromUser, ts: Date.now() });
        await rtm.publish(fromUser, replyMsg, { channelType: 'USER' });
        closeCallInviteDialog();
    };
    const btnDeny = document.createElement('button');
    btnDeny.className = 'btn btn-danger';
    btnDeny.textContent = '拒绝';
    btnDeny.style.marginLeft = '16px';
    btnDeny.onclick = async () => {
        playAudio('music/deny.mp3');
        addLog('已拒绝呼叫邀请');
        const replyMsg = JSON.stringify({ type: 'call-deny', from: currentUserId, to: fromUser, ts: Date.now() });
        await rtm.publish(fromUser, replyMsg, { channelType: 'USER' });
        closeCallInviteDialog();
    };
    callInviteDialog.appendChild(btnAccept);
    callInviteDialog.appendChild(btnDeny);
    document.body.appendChild(callInviteDialog);
    // 10s倒计时关闭弹窗
    if (callInviteTimer) clearTimeout(callInviteTimer);
    callInviteTimer = setTimeout(() => {
        addLog('未能及时处理呼叫邀请，弹窗自动关闭');
        playAudio(''); // 停止播放 becalled.mp3
        closeCallInviteDialog();
    }, 10000);
}

// 关闭呼叫邀请弹窗
function closeCallInviteDialog() {
    if (callInviteDialog) {
        document.body.removeChild(callInviteDialog);
        callInviteDialog = null;
    }
    const blurBg = document.getElementById('callInviteBlurBg');
    if (blurBg) document.body.removeChild(blurBg);
    if (callInviteTimer) {
        clearTimeout(callInviteTimer);
        callInviteTimer = null;
    }
}

// RTM 登录按钮事件
loginBtn.onclick = async () => {
    const appId = appIdInput.value.trim();
    const userId = userIdInput.value.trim();
    const token = tokenInput.value.trim();
    if (!appId || !userId) {
        showStatus('请填写 App ID 和用户 ID', 'disconnected');
        return;
    }
    showStatus('正在登录...', 'connected');
    try {
        const { RTM } = AgoraRTM;
        rtm = new RTM(appId, userId);
        // 事件监听
    // 消息事件监听（频道消息、点对点消息、呼叫邀请、查询在线等）
    rtm.addEventListener('message', event => {
            let msgObj = null;
            try { msgObj = JSON.parse(event.message); } catch {}
            // 查询在线消息处理
            if (msgObj && msgObj.type === 'query-online') {
                if (event.publisher !== currentUserId) {
                    addLog(`${event.publisher} 查询了您的用户在线状态`);
                }
                return;
            }
            if (msgObj && msgObj.type === 'call-invite') {
                // 被叫方收到呼叫邀请
                if (event.publisher !== currentUserId) {
                    playAudio('music/becalled.mp3');
                    showCallInviteDialog(msgObj.from);
                    addLog(`收到来自 ${msgObj.from} 的呼叫邀请`);
                }
                return;
            }
            if (msgObj && (msgObj.type === 'call-accept' || msgObj.type === 'call-deny')) {
                // 主叫方收到接收/拒绝回复
                if (event.publisher !== currentUserId) {
                    playAudio(msgObj.type === 'call-accept' ? 'music/accept.mp3' : 'music/deny.mp3');
                    if (msgObj.type === 'call-accept') {
                        addLog(`呼叫方收到 ${event.publisher} 的确认：对方已接受通话邀请`);
                    } else if (msgObj.type === 'call-deny') {
                        addLog(`呼叫方收到 ${event.publisher} 的确认：对方已拒绝通话邀请`);
                    }
                    if (callInviteTimer) clearTimeout(callInviteTimer);
                    callInviteState = null;
                    closeCallInviteDialog();
                }
                return;
            }
            // 普通消息
            if (event.publisher === currentUserId) return;
            addMessage(event.message, 'received', new Date(), event.publisher);
            addLog(`收到消息: ${event.publisher}: ${event.message}`);
        });
    // 频道用户进出监听（Presence），JOIN/LEAVE 事件日志输出
    rtm.addEventListener('presence', event => {
            // 只处理频道相关的 presence 事件
            if (event.channelType === 'MESSAGE' && event.channelName === currentChannel) {
                if (event.eventType === 'JOIN') {
                    addLog(`频道用户进入：${event.publisher} 加入频道 [${event.channelName}]`);
                } else if (event.eventType === 'LEAVE') {
                    addLog(`频道用户离开：${event.publisher} 离开频道 [${event.channelName}]`);
                }
            }
            // 其他 presence 事件也可按需打印
            addLog(`Presence: ${event.publisher} ${event.eventType}`);
        });
    // RTM 连接状态变化监听
    rtm.addEventListener('linkState', event => {
        const currentState = event.currentState;
        const previousState = event.previousState;
        const serviceType = event.serviceType;
        const operation = event.operation;
        const reason = event.reason;
        const affectedChannels = event.affectedChannels;
        const timestamp = event.timestamp;
        const isResumed = event.isResumed;
        
        showStatus('连接状态变化: ' + currentState, currentState === 'CONNECTED' ? 'connected' : 'disconnected');
        addLog(`LinkState事件: 当前状态=${currentState}, 之前状态=${previousState}, 服务类型=${serviceType}, 操作=${operation}, 原因=${reason}`);
        });
        
        // Token 即将过期事件监听
        rtm.addEventListener('tokenPrivilegeWillExpire', async (channelName) => {
            // 只有 streamchannel 才有 channelName 返回，本 Demo 用不上
            showStatus(`⚠️ Token 即将过期，请及时更新！`, 'disconnected');
            addLog(`请输入新的Token并点击"更新Token"按钮`);
            
            // 高亮显示token更新区域
            newTokenInput.style.borderColor = '#ff9800';
            renewTokenBtn.style.background = '#ff9800';
            renewTokenBtn.style.animation = 'pulse 1s infinite';
        });
        
        // 登录
        await rtm.login({ token });
        currentUserId = userId;
        showStatus('RTM 登录成功', 'connected');
        setRTMFeatureVisible(true);
        loginBtn.disabled = true;
        logoutBtn.disabled = false;
        subscribeBtn.disabled = false;
        unsubscribeBtn.disabled = false;
        channelInput.disabled = false;
        targetUserInput.disabled = false;
        messageInput.disabled = false;
        sendP2PBtn.disabled = false;
    channelMsgInput.disabled = true;
    sendChannelMsgBtn.disabled = true;
    callUserInput.disabled = false;
    sendCallInviteBtn.disabled = false;
    queryUserInput.disabled = false;
    queryUserOnlineBtn.disabled = false;
    newTokenInput.disabled = false;
    renewTokenBtn.disabled = false;
    } catch (e) {
        showStatus('RTM 登录失败: ' + e.message, 'disconnected');
        addLog('RTM 登录失败: ' + e.message);
    }
};

// RTM 登出按钮事件
logoutBtn.onclick = async () => {
    if (rtm) {
        await rtm.logout();
        rtm = null;
        currentUserId = '';
        currentChannel = '';
        loginBtn.disabled = false;
        logoutBtn.disabled = true;
        subscribeBtn.disabled = true;
        unsubscribeBtn.disabled = true;
        channelInput.disabled = true;
        targetUserInput.disabled = true;
        messageInput.disabled = true;
        sendP2PBtn.disabled = true;
    channelMsgInput.disabled = true;
    sendChannelMsgBtn.disabled = true;
    callUserInput.disabled = true;
    sendCallInviteBtn.disabled = true;
    queryUserInput.disabled = true;
    queryUserOnlineBtn.disabled = true;
    newTokenInput.disabled = true;
    renewTokenBtn.disabled = true;
    newTokenInput.value = '';
    addLog('已登出 RTM');
        showStatus('已登出', 'disconnected');
        updateUserList([]);
        setRTMFeatureVisible(false);
    }
};

// 订阅频道按钮事件
subscribeBtn.onclick = async () => {
    const channelName = channelInput.value.trim();
    if (!channelName) {
        showStatus('请输入频道名称', 'disconnected');
        return;
    }
    try {
        await rtm.subscribe(channelName);
        currentChannel = channelName;
        showStatus(`已加入频道: ${channelName}`, 'connected');
        subscribeBtn.disabled = true;
        unsubscribeBtn.disabled = false;
    channelMsgInput.disabled = false;
    sendChannelMsgBtn.disabled = true;
    addLog(`已订阅频道: ${channelName}`);
    } catch (e) {
        showStatus('加入频道失败: ' + e.message, 'disconnected');
        addLog('加入频道失败: ' + e.message);
    }
};

// 取消订阅频道按钮事件
unsubscribeBtn.onclick = async () => {
    if (rtm && currentChannel) {
        await rtm.unsubscribe(currentChannel);
        showStatus(`已离开频道: ${currentChannel}`, 'disconnected');
        subscribeBtn.disabled = false;
        unsubscribeBtn.disabled = true;
    channelMsgInput.disabled = true;
    sendChannelMsgBtn.disabled = true;
    channelMsgInput.value = '';
    addLog(`已取消订阅频道: ${currentChannel}`);
        userList = [];
        updateUserList(userList);
        currentChannel = '';
    }
};

// 发送点对点消息按钮事件
sendP2PBtn.onclick = async () => {
    const msg = messageInput.value.trim();
    const targetId = targetUserInput.value.trim();
    if (!msg || !targetId || !rtm) return;
    try {
        // 官方文档推荐点对点消息发送方式
        const result = await rtm.publish(targetId, msg, { channelType: 'USER' });
        addMessage(msg, 'sent', new Date(), currentUserId);
        addLog(`发送点对点消息给 ${targetId}: ${msg}`);
        addLog('点对点消息发送结果: ' + JSON.stringify(result));
        messageInput.value = '';
    } catch (e) {
        addLog('点对点消息发送失败: ' + (e.message || e));
    }
};
// 发送频道消息按钮事件
sendChannelMsgBtn.onclick = async () => {
    const msg = channelMsgInput.value.trim();
    if (!msg || !currentChannel || !rtm) return;
    try {
        const result = await rtm.publish(currentChannel, msg, { channelType: 'MESSAGE' });
        addMessage(msg, 'sent', new Date(), currentUserId);
        addLog(`频道消息已发送到频道 [${currentChannel}]，内容：${msg}`);
        addLog('频道消息发送成功，SDK返回：' + JSON.stringify(result));
        channelMsgInput.value = '';
        sendChannelMsgBtn.disabled = true;
    } catch (e) {
        addLog('频道消息发送失败: ' + (e.message || e));
    }
};

// 发送呼叫邀请按钮事件
sendCallInviteBtn.onclick = async () => {
    const targetId = callUserInput.value.trim();
    if (!targetId || !rtm) return;
    try {
        // 发送自定义呼叫邀请消息
        const inviteMsg = JSON.stringify({ type: 'call-invite', from: currentUserId, to: targetId, ts: Date.now() });
        await rtm.publish(targetId, inviteMsg, { channelType: 'USER' });
        addLog(`已向 ${targetId} 发送呼叫邀请`);
        playAudio('music/calling.mp3');
        callInviteState = 'calling';
        showCallerWaitingDialog(targetId);
    } catch (e) {
        addLog('呼叫邀请发送失败: ' + (e.message || e));
    }

// 呼叫方等待弹窗（主叫方）
function showCallerWaitingDialog(targetId) {
    closeCallInviteDialog();
    // 高斯模糊背景
    const blurBg = document.createElement('div');
    blurBg.style.position = 'fixed';
    blurBg.style.left = '0';
    blurBg.style.top = '0';
    blurBg.style.width = '100vw';
    blurBg.style.height = '100vh';
    blurBg.style.background = 'rgba(0,0,0,0.2)';
    blurBg.style.backdropFilter = 'blur(8px)';
    blurBg.style.zIndex = '9998';
    blurBg.id = 'callInviteBlurBg';
    document.body.appendChild(blurBg);
    callInviteDialog = document.createElement('div');
    callInviteDialog.style.position = 'fixed';
    callInviteDialog.style.left = '50%';
    callInviteDialog.style.top = '30%';
    callInviteDialog.style.transform = 'translate(-50%, -50%)';
    callInviteDialog.style.background = '#fff';
    callInviteDialog.style.border = '2px solid #764ba2';
    callInviteDialog.style.borderRadius = '12px';
    callInviteDialog.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    callInviteDialog.style.padding = '32px 24px';
    callInviteDialog.style.zIndex = '9999';
    callInviteDialog.innerHTML = `<div style=\"font-size:1.2rem;margin-bottom:16px;\">呼叫中 <b>${targetId}</b></div>`;
    // 倒计时
    const countdown = document.createElement('div');
    countdown.style.fontSize = '1rem';
    countdown.style.marginBottom = '16px';
    let timeLeft = 10;
    countdown.textContent = `等待对方响应：${timeLeft}s`;
    callInviteDialog.appendChild(countdown);
    const timer = setInterval(() => {
        timeLeft--;
        countdown.textContent = `等待对方响应：${timeLeft}s`;
        if (timeLeft <= 0) clearInterval(timer);
    }, 1000);
    document.body.appendChild(callInviteDialog);
    // 10s超时关闭弹窗
    if (callInviteTimer) clearTimeout(callInviteTimer);
    callInviteTimer = setTimeout(() => {
        addLog('呼叫方未收到对方回复，超时结束');
        playAudio('');
        callInviteState = null;
        closeCallInviteDialog();
    }, 10000);
}
};


// ===============================
// 查询指定用户是否在线功能说明：
// RTM SDK 没有直接查询某个用户是否在线的接口，
// 只能通过发送点对点消息（publish）给目标用户，
// 若发送成功则说明对方在线，失败则说明不在线。
// 远端收到查询消息也会在日志区提示。
// ===============================
queryUserOnlineBtn.onclick = async () => {
    const targetId = queryUserInput.value.trim();
    if (!targetId || !rtm) return;
    try {
        const queryMsg = JSON.stringify({ type: 'query-online', from: currentUserId, to: targetId, ts: Date.now() });
        await rtm.publish(targetId, queryMsg, { channelType: 'USER' });
        addLog(`查询成功，对方在线：${targetId}`);
    } catch (e) {
        addLog(`查询失败，对方不在线：${targetId}`);
    }
};

messageInput.addEventListener('input', () => {
    sendP2PBtn.disabled = !messageInput.value.trim() || !targetUserInput.value.trim();
});

channelMsgInput.addEventListener('input', () => {
    sendChannelMsgBtn.disabled = !channelMsgInput.value.trim() || !currentChannel;
});

targetUserInput.addEventListener('input', () => {
    sendP2PBtn.disabled = !messageInput.value.trim() || !targetUserInput.value.trim();
});

// ===============================
// 刷新频道用户列表说明：
// whoNow 只能查询当前已订阅频道内的用户在线状态，
// 频道外的用户无法查询（即只能看到已加入频道的用户）。
// ===============================
const refreshUserListBtn = document.getElementById('refreshUserListBtn');
refreshUserListBtn.onclick = async () => {
    if (!currentChannel) {
        userListArea.innerHTML = '<div class="user-item"><span>请先订阅频道</span></div>';
        return;
    }
    try {
        const options = {
            includedUserId: true,
            includedState: true
        };
        const result = await rtm.presence.whoNow(currentChannel, 'MESSAGE', options);
        if (result.totalOccupancy === 0) {
            updateUserList([]);
        } else {
            updateUserList(result.occupants.map(u => u.userId));
        }
        addLog('频道用户列表刷新成功');
    } catch (e) {
        userListArea.innerHTML = '<div class="user-item"><span>获取频道用户失败: ' + (e.reason || e.message || e) + '</span></div>';
        addLog('获取频道用户失败: ' + (e.reason || e.message || e));
    }
};

// 更新 Token 按钮事件
renewTokenBtn.onclick = async () => {
    const newToken = newTokenInput.value.trim();
    if (!newToken || !rtm) {
        showStatus('请输入新的 Token', 'disconnected');
        return;
    }
    
    try {
        showStatus('正在更新 Token...', 'connected');
        addLog('开始更新 Token...');
        
        const result = await rtm.renewToken(newToken);
        
        // 检查返回结果类型
        if (result.error) {
            // 错误情况 - ErrorInfo 类型
            showStatus(`Token 更新失败: ${result.reason}`, 'disconnected');
            addLog(`Token 更新失败: [${result.errorCode}] ${result.reason} (操作: ${result.operation})`);
        } else {
            // 成功情况 - RenewTokenResponse 类型
            showStatus('Token 更新成功！', 'connected');
            // 当前版本更新成功后时间戳只会返回 0，等后续某个版本会开始返回准确时间戳，这里显不出来
            addLog(`Token 更新成功!`);
            
            // 重置高亮状态
            newTokenInput.style.borderColor = '';
            renewTokenBtn.style.background = '';
            renewTokenBtn.style.animation = '';
            newTokenInput.value = '';
        }
        
    } catch (e) {
        showStatus('Token 更新异常: ' + e.message, 'disconnected');
        addLog('Token 更新发生异常: ' + (e.message || e));
    }
};
