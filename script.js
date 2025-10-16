// Agora RTM 2.x Web Demo

let rtm = null;
let currentUserId = '';
let currentChannel = '';
let userList = [];

const appIdInput = document.getElementById('appIdInput');
const userIdInput = document.getElementById('userIdInput');
const channelInput = document.getElementById('channelInput');
const tokenInput = document.getElementById('tokenInput');
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

// 呼叫邀请相关变量
const callUserInput = document.getElementById('callUserInput');
const sendCallInviteBtn = document.getElementById('sendCallInviteBtn');
let callInviteTimer = null;
let callInviteDialog = null;
let callInviteAudio = null;
let callInviteState = null; // 'calling', 'waiting', 'accepted', 'denied'

function showStatus(msg, type = 'connected') {
    statusArea.innerHTML = `<div class="status status-${type}">${msg}</div>`;
    addLog(msg);
}

function addMessage(content, type = 'received', time = new Date(), user = '') {
    // 只展示本地发送和远端接收的消息
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${type}`;
    msgDiv.innerHTML = `<div>${user ? `<b>${user}:</b> ` : ''}${content}</div><div class="message-time">${time.toLocaleTimeString()}</div>`;
    messageArea.appendChild(msgDiv);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function addLog(log) {
    const logDiv = document.createElement('div');
    logDiv.textContent = `[${new Date().toLocaleTimeString()}] ${log}`;
    logArea.appendChild(logDiv);
    logArea.scrollTop = logArea.scrollHeight;
}

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

// 音频播放工具
function playAudio(src) {
    if (callInviteAudio) {
        callInviteAudio.pause();
        callInviteAudio.currentTime = 0;
    }
    if (src) {
        callInviteAudio = new Audio(src);
        callInviteAudio.play();
    }
}

// 呼叫邀请弹窗
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
        rtm.addEventListener('message', event => {
            let msgObj = null;
            try { msgObj = JSON.parse(event.message); } catch {}
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
        rtm.addEventListener('presence', event => {
            addLog(`Presence: ${event.publisher} ${event.eventType}`);
        });
        rtm.addEventListener('status', event => {
            showStatus('状态变化: ' + event.state, event.state === 'CONNECTED' ? 'connected' : 'disconnected');
            addLog('状态事件: ' + JSON.stringify(event));
        });
        // 登录
        await rtm.login({ token });
        currentUserId = userId;
        showStatus('RTM 登录成功', 'connected');
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
    addLog('RTM 登录成功');
    } catch (e) {
        showStatus('RTM 登录失败: ' + e.message, 'disconnected');
        addLog('RTM 登录失败: ' + e.message);
    }
};

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
    addLog('已登出 RTM');
        showStatus('已登出', 'disconnected');
        updateUserList([]);
    }
};

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

// 呼叫方等待弹窗
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


messageInput.addEventListener('input', () => {
    sendP2PBtn.disabled = !messageInput.value.trim() || !targetUserInput.value.trim();
});

channelMsgInput.addEventListener('input', () => {
    sendChannelMsgBtn.disabled = !channelMsgInput.value.trim() || !currentChannel;
});

targetUserInput.addEventListener('input', () => {
    sendP2PBtn.disabled = !messageInput.value.trim() || !targetUserInput.value.trim();
});
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
