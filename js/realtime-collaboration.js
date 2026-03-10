/**
 * Real-time Collaboration Features for Mission Control
 * Implements multi-user editing, live presence indicators, and shared annotations
 */

class RealtimeCollaboration {
    constructor() {
        this.socket = null;
        this.userId = this.getUserId();
        this.userName = this.getUserName();
        this.presenceInterval = null;
        this.userPresence = new Map();
        this.annotations = new Map();
        this.chatMessages = [];
        this.isInitialized = false;
        this.collaborationEnabled = false;
    }

    // Initialize real-time collaboration
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Get WebSocket URL from config or default
            const wsUrl = this.getWebSocketUrl();
            
            // Connect to WebSocket server
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('Real-time collaboration connected');
                this.collaborationEnabled = true;
                this.sendPresenceUpdate();
                this.startPresenceHeartbeat();
                this.isInitialized = true;
                this.updateCollaborationStatus();
            };
            
            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };
            
            this.socket.onclose = () => {
                console.log('Real-time collaboration disconnected');
                this.collaborationEnabled = false;
                this.updateCollaborationStatus();
                this.stopPresenceHeartbeat();
            };
            
            this.socket.onerror = (error) => {
                console.error('Real-time collaboration error:', error);
                this.collaborationEnabled = false;
                this.updateCollaborationStatus();
            };
            
        } catch (error) {
            console.error('Failed to initialize real-time collaboration:', error);
            this.collaborationEnabled = false;
            this.updateCollaborationStatus();
        }
    }

    // Get WebSocket URL
    getWebSocketUrl() {
        // Use VPS URL from config if available, otherwise use localhost
        const vpsUrl = window.CONFIG?.VPS_URL || 'http://localhost:3001';
        const wsUrl = vpsUrl.replace('http', 'ws');
        return `${wsUrl}/collaboration`;
    }

    // Get user ID (from localStorage or generate new)
    getUserId() {
        let userId = localStorage.getItem('missionControlUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('missionControlUserId', userId);
        }
        return userId;
    }

    // Get user name (from localStorage or default)
    getUserName() {
        let userName = localStorage.getItem('missionControlUserName');
        if (!userName) {
            userName = 'User ' + this.userId.substr(this.userId.length - 6);
            localStorage.setItem('missionControlUserName', userName);
        }
        return userName;
    }

    // Handle incoming messages
    handleMessage(data) {
        switch (data.type) {
            case 'presence_update':
                this.handlePresenceUpdate(data);
                break;
            case 'presence_remove':
                this.handlePresenceRemove(data);
                break;
            case 'project_update':
                this.handleProjectUpdate(data);
                break;
            case 'annotation_add':
                this.handleAnnotationAdd(data);
                break;
            case 'annotation_remove':
                this.handleAnnotationRemove(data);
                break;
            case 'chat_message':
                this.handleChatMessage(data);
                break;
            case 'user_joined':
                this.handleUserJoined(data);
                break;
            case 'user_left':
                this.handleUserLeft(data);
                break;
            default:
                console.warn('Unknown message type:', data.type);
        }
    }

    // Send presence update
    sendPresenceUpdate() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        
        const presenceData = {
            type: 'presence_update',
            userId: this.userId,
            userName: this.userName,
            timestamp: Date.now(),
            currentPage: this.getCurrentPage(),
            activeElement: this.getActiveElement()
        };
        
        this.socket.send(JSON.stringify(presenceData));
    }

    // Start presence heartbeat
    startPresenceHeartbeat() {
        if (this.presenceInterval) return;
        
        this.presenceInterval = setInterval(() => {
            this.sendPresenceUpdate();
        }, 30000); // Send every 30 seconds
    }

    // Stop presence heartbeat
    stopPresenceHeartbeat() {
        if (this.presenceInterval) {
            clearInterval(this.presenceInterval);
            this.presenceInterval = null;
        }
    }

    // Handle presence update
    handlePresenceUpdate(data) {
        this.userPresence.set(data.userId, {
            userName: data.userName,
            timestamp: data.timestamp,
            currentPage: data.currentPage,
            activeElement: data.activeElement,
            lastSeen: Date.now()
        });
        
        this.updatePresenceIndicators();
    }

    // Handle presence remove
    handlePresenceRemove(data) {
        this.userPresence.delete(data.userId);
        this.updatePresenceIndicators();
    }

    // Handle user joined
    handleUserJoined(data) {
        this.showNotification(`${data.userName} has joined the collaboration session`, 'info');
        this.userPresence.set(data.userId, {
            userName: data.userName,
            timestamp: Date.now(),
            currentPage: 'unknown',
            activeElement: 'unknown',
            lastSeen: Date.now()
        });
        this.updatePresenceIndicators();
    }

    // Handle user left
    handleUserLeft(data) {
        this.showNotification(`${data.userName} has left the collaboration session`, 'info');
        this.userPresence.delete(data.userId);
        this.updatePresenceIndicators();
    }

    // Update presence indicators
    updatePresenceIndicators() {
        // Update presence count in UI
        const presenceCount = this.userPresence.size;
        const presenceElement = document.getElementById('collaborationPresence');
        if (presenceElement) {
            if (presenceCount === 0) {
                presenceElement.textContent = '';
                presenceElement.style.display = 'none';
            } else if (presenceCount === 1) {
                presenceElement.textContent = 'You are collaborating alone';
                presenceElement.style.display = 'block';
            } else {
                presenceElement.textContent = `${presenceCount} people collaborating`;
                presenceElement.style.display = 'block';
            }
        }
        
        // Update presence list in collaboration panel
        this.updatePresenceList();
    }

    // Update presence list in collaboration panel
    updatePresenceList() {
        const presenceList = document.getElementById('collaborationPresenceList');
        if (!presenceList) return;
        
        // Filter out stale presence (older than 1 minute)
        const now = Date.now();
        for (const [userId, presence] of this.userPresence.entries()) {
            if (now - presence.lastSeen > 60000) {
                this.userPresence.delete(userId);
            }
        }
        
        if (this.userPresence.size === 0) {
            presenceList.innerHTML = '<div class="text-center text-muted">No collaborators online</div>';
            return;
        }
        
        let html = '';
        for (const [userId, presence] of this.userPresence.entries()) {
            if (userId === this.userId) continue; // Skip current user
            
            const timeAgo = this.getTimeAgo(presence.lastSeen);
            html += `
                <div class="collaborator-item">
                    <div class="collaborator-info">
                        <span class="collaborator-name">${presence.userName}</span>
                        <span class="collaborator-status">Active ${timeAgo}</span>
                    </div>
                    <div class="collaborator-page">${presence.currentPage}</div>
                </div>
            `;
        }
        
        presenceList.innerHTML = html;
    }

    // Get current page
    getCurrentPage() {
        const activeTab = document.querySelector('.nav-tab.active');
        return activeTab ? activeTab.dataset.tab : 'unknown';
    }

    // Get active element
    getActiveElement() {
        const activeElement = document.activeElement;
        if (!activeElement) return 'unknown';
        
        if (activeElement.classList.contains('task-card')) {
            return 'task-card';
        } else if (activeElement.classList.contains('agent-card')) {
            return 'agent-card';
        } else if (activeElement.id === 'notesTextarea') {
            return 'notes';
        }
        
        return activeElement.tagName.toLowerCase();
    }

    // Handle project update
    handleProjectUpdate(data) {
        // Find the project in local state
        const projectIndex = window.state.projects.findIndex(p => p.id === data.projectId);
        if (projectIndex !== -1) {
            // Update project
            window.state.projects[projectIndex] = data.project;
            
            // Re-render projects if on projects tab
            if (document.getElementById('projectsTab').classList.contains('active')) {
                window.renderProjects();
            }
            
            // Show notification if not the current user's action
            if (data.userId !== this.userId) {
                this.showNotification(`${data.userName} updated project "${data.project.title}"`, 'info');
            }
        }
    }

    // Send project update
    sendProjectUpdate(projectId, project) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        
        const updateData = {
            type: 'project_update',
            projectId: projectId,
            project: project,
            userId: this.userId,
            userName: this.userName,
            timestamp: Date.now()
        };
        
        this.socket.send(JSON.stringify(updateData));
    }

    // Annotation methods
    addAnnotation(elementId, annotation) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        
        const annotationData = {
            type: 'annotation_add',
            elementId: elementId,
            annotation: annotation,
            userId: this.userId,
            userName: this.userName,
            timestamp: Date.now()
        };
        
        this.socket.send(JSON.stringify(annotationData));
        this.handleAnnotationAdd(annotationData);
    }

    removeAnnotation(elementId, annotationId) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        
        const annotationData = {
            type: 'annotation_remove',
            elementId: elementId,
            annotationId: annotationId,
            userId: this.userId,
            timestamp: Date.now()
        };
        
        this.socket.send(JSON.stringify(annotationData));
        this.handleAnnotationRemove(annotationData);
    }

    handleAnnotationAdd(data) {
        if (!this.annotations.has(data.elementId)) {
            this.annotations.set(data.elementId, []);
        }
        
        this.annotations.get(data.elementId).push({
            id: data.annotation.id,
            text: data.annotation.text,
            userId: data.userId,
            userName: data.userName,
            timestamp: data.timestamp
        });
        
        this.renderAnnotations(data.elementId);
        
        // Show notification if not the current user's action
        if (data.userId !== this.userId) {
            this.showNotification(`${data.userName} added an annotation`, 'info');
        }
    }

    handleAnnotationRemove(data) {
        if (this.annotations.has(data.elementId)) {
            const annotations = this.annotations.get(data.elementId);
            const index = annotations.findIndex(a => a.id === data.annotationId);
            if (index !== -1) {
                annotations.splice(index, 1);
            }
            
            this.renderAnnotations(data.elementId);
        }
    }

    renderAnnotations(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Remove existing annotation containers
        const existingContainer = element.querySelector('.annotation-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        if (!this.annotations.has(elementId) || this.annotations.get(elementId).length === 0) {
            return;
        }
        
        const container = document.createElement('div');
        container.className = 'annotation-container';
        
        this.annotations.get(elementId).forEach(annotation => {
            const annotationEl = document.createElement('div');
            annotationEl.className = 'annotation-item';
            annotationEl.innerHTML = `
                <div class="annotation-content">${annotation.text}</div>
                <div class="annotation-meta">
                    <span class="annotation-author">${annotation.userName}</span>
                    <span class="annotation-time">${this.getTimeAgo(annotation.timestamp)}</span>
                    ${annotation.userId === this.userId ? 
                        `<button class="annotation-delete" onclick="realtimeCollab.removeAnnotation('${elementId}', '${annotation.id}')">×</button>` : 
                        ''}
                </div>
            `;
            container.appendChild(annotationEl);
        });
        
        element.appendChild(container);
    }

    // Chat methods
    sendChatMessage(message) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        
        const chatData = {
            type: 'chat_message',
            message: message,
            userId: this.userId,
            userName: this.userName,
            timestamp: Date.now()
        };
        
        this.socket.send(JSON.stringify(chatData));
        this.handleChatMessage(chatData);
    }

    handleChatMessage(data) {
        this.chatMessages.push(data);
        
        // Keep only last 100 messages
        if (this.chatMessages.length > 100) {
            this.chatMessages.shift();
        }
        
        this.renderChatMessages();
        
        // Show notification if not the current user's message
        if (data.userId !== this.userId) {
            this.showNotification(`${data.userName}: ${data.message}`, 'chat');
        }
    }

    renderChatMessages() {
        const chatContainer = document.getElementById('collaborationChatMessages');
        if (!chatContainer) return;
        
        let html = '';
        this.chatMessages.forEach(msg => {
            const isOwnMessage = msg.userId === this.userId;
            html += `
                <div class="chat-message ${isOwnMessage ? 'own-message' : ''}">
                    <div class="chat-message-header">
                        <span class="chat-username ${isOwnMessage ? 'own-username' : ''}">${msg.userName}</span>
                        <span class="chat-timestamp">${this.formatTimestamp(msg.timestamp)}</span>
                    </div>
                    <div class="chat-message-content">${this.escapeHtml(msg.message)}</div>
                </div>
            `;
        });
        
        chatContainer.innerHTML = html;
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Helper methods
    getTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`Notification [${type}]: ${message}`);
        }
    }

    updateCollaborationStatus() {
        const statusElement = document.getElementById('collaborationStatus');
        if (statusElement) {
            if (this.collaborationEnabled) {
                statusElement.textContent = 'Connected';
                statusElement.className = 'collaboration-status connected';
            } else {
                statusElement.textContent = 'Disconnected';
                statusElement.className = 'collaboration-status disconnected';
            }
        }
    }

    // Cleanup method
    destroy() {
        this.stopPresenceHeartbeat();
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isInitialized = false;
        this.collaborationEnabled = false;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.realtimeCollab = new RealtimeCollaboration();
    
    // Add collaboration panel to UI if it doesn't exist
    if (!document.getElementById('collaborationPanel')) {
        const collaborationPanelHTML = `
            <div class="collaboration-panel" id="collaborationPanel">
                <div class="collaboration-header">
                    <h3>👥 Team Collaboration</h3>
                    <div class="collaboration-status" id="collaborationStatus">Disconnected</div>
                </div>
                
                <div class="collaboration-section">
                    <h4>Online Collaborators</h4>
                    <div class="collaboration-presence-list" id="collaborationPresenceList">
                        <div class="text-center text-muted">Connecting...</div>
                    </div>
                </div>
                
                <div class="collaboration-section">
                    <h4>Team Chat</h4>
                    <div class="collaboration-chat-messages" id="collaborationChatMessages"></div>
                    <div class="collaboration-chat-input">
                        <input type="text" id="collaborationChatInput" placeholder="Type a message..." maxlength="500">
                        <button id="collaborationChatSend">Send</button>
                    </div>
                </div>
                
                <div class="collaboration-section">
                    <h4>Quick Actions</h4>
                    <div class="collaboration-actions">
                        <button id="collaborationInviteBtn">Invite Team</button>
                        <button id="collaborationSettingsBtn">Settings</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to header or main content
        const header = document.querySelector('.header');
        if (header) {
            const collaborationContainer = document.createElement('div');
            collaborationContainer.id = 'collaborationContainer';
            collaborationContainer.style.cssText = `
                position: absolute;
                top: 60px;
                right: 20px;
                z-index: 1000;
                display: none;
            `;
            collaborationContainer.innerHTML = collaborationPanelHTML;
            header.appendChild(collaborationContainer);
        }
    }
    
    // Setup event listeners
    const chatInput = document.getElementById('collaborationChatInput');
    const chatSend = document.getElementById('collaborationChatSend');
    const inviteBtn = document.getElementById('collaborationInviteBtn');
    const settingsBtn = document.getElementById('collaborationSettingsBtn');
    
    if (chatInput && chatSend) {
        chatSend.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message) {
                window.realtimeCollab.sendChatMessage(message);
                chatInput.value = '';
            }
        });
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = chatInput.value.trim();
                if (message) {
                    window.realtimeCollab.sendChatMessage(message);
                    chatInput.value = '';
                }
            }
        });
    }
    
    if (inviteBtn) {
        inviteBtn.addEventListener('click', () => {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                window.realtimeCollab.showNotification('Invite link copied to clipboard!', 'success');
            }).catch(() => {
                window.realtimeCollab.showNotification('Failed to copy invite link', 'error');
            });
        });
    }
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.realtimeCollab.showNotification('Collaboration settings coming soon!', 'info');
        });
    }
    
    // Initialize collaboration when user interacts with the page
    document.addEventListener('click', () => {
        if (!window.realtimeCollab.isInitialized) {
            window.realtimeCollab.init();
        }
    }, { once: true });
});

// Make available globally
window.RealtimeCollaboration = RealtimeCollaboration;