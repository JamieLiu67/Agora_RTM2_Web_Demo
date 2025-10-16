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
            // 如果是自己发的消息，已在本地展示过，不再重复展示
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
