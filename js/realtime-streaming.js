/**
 * Real-time Data Streaming Module for Mission Control
 * Handles WebSocket connections and real-time data updates
 */

class RealTimeStreaming {
    constructor(config) {
        this.config = config;
        this.websocket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.dataHandlers = new Map();
        this.streamingEnabled = true;
        this.streamingQuality = 'medium';
        this.lastUpdate = null;
    }

    /**
     * Initialize WebSocket connection
     */
    initialize() {
        if (!this.config.VPS_URL) {
            console.error('VPS URL not configured');
            return;
        }

        // Extract hostname and port from VPS URL
        const url = new URL(this.config.VPS_URL);
        const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${url.host}/ws`;

        try {
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.notifyConnectionStatus('connected');
                
                // Send initial subscription request
                this.sendSubscriptionRequest();
            };

            this.websocket.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
                this.notifyConnectionStatus('disconnected');
                this.attemptReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.notifyConnectionStatus('error');
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.notifyConnectionStatus('error');
        }
    }

    /**
     * Handle incoming messages
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'metrics_update':
                    this.handleMetricsUpdate(message.data);
                    break;
                case 'projects_update':
                    this.handleProjectsUpdate(message.data);
                    break;
                case 'agents_update':
                    this.handleAgentsUpdate(message.data);
                    break;
                case 'activity_update':
                    this.handleActivityUpdate(message.data);
                    break;
                case 'notification':
                    this.handleNotification(message.data);
                    break;
                case 'heartbeat':
                    this.handleHeartbeat(message.data);
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    /**
     * Send subscription request to server
     */
    sendSubscriptionRequest() {
        if (!this.isConnected) return;

        const subscription = {
            type: 'subscribe',
            topics: ['metrics', 'projects', 'agents', 'activity'],
            quality: this.streamingQuality
        };

        this.websocket.send(JSON.stringify(subscription));
    }

    /**
     * Handle metrics updates
     */
    handleMetricsUpdate(metrics) {
        if (!this.streamingEnabled) return;
        
        // Update local state
        window.state.metrics = metrics;
        
        // Update UI components
        if (typeof window.renderMetrics === 'function') {
            window.renderMetrics();
        }
        
        if (typeof window.updateCharts === 'function') {
            window.updateCharts();
        }
        
        this.lastUpdate = { type: 'metrics', timestamp: Date.now() };
    }

    /**
     * Handle projects updates
     */
    handleProjectsUpdate(projects) {
        if (!this.streamingEnabled) return;
        
        window.state.projects = projects;
        
        if (typeof window.renderProjects === 'function') {
            window.renderProjects();
        }
        
        this.lastUpdate = { type: 'projects', timestamp: Date.now() };
    }

    /**
     * Handle agents updates
     */
    handleAgentsUpdate(agents) {
        if (!this.streamingEnabled) return;
        
        window.state.agents = agents;
        
        if (typeof window.renderAgents === 'function') {
            window.renderAgents();
        }
        
        if (typeof window.updateCharts === 'function') {
            window.updateCharts();
        }
        
        this.lastUpdate = { type: 'agents', timestamp: Date.now() };
    }

    /**
     * Handle activity updates
     */
    handleActivityUpdate(activity) {
        if (!this.streamingEnabled) return;
        
        window.state.activityLog = activity.slice(0, window.CONFIG?.MAX_ACTIVITY_ITEMS || 50);
        
        if (typeof window.renderActivityFeed === 'function') {
            window.renderActivityFeed();
        }
        
        this.lastUpdate = { type: 'activity', timestamp: Date.now() };
    }

    /**
     * Handle notifications
     */
    handleNotification(notification) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(notification.message, notification.type || 'info');
        }
    }

    /**
     * Handle heartbeat messages
     */
    handleHeartbeat(data) {
        // Update connection status based on heartbeat
        if (typeof window.updateConnectionStatus === 'function') {
            window.updateConnectionStatus();
        }
    }

    /**
     * Attempt to reconnect after disconnection
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
            if (!this.isConnected) {
                this.initialize();
            }
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    /**
     * Notify connection status changes
     */
    notifyConnectionStatus(status) {
        window.state.connectionStatus = status;
        
        if (typeof window.updateConnectionStatus === 'function') {
            window.updateConnectionStatus();
        }
        
        // Update streaming indicator
        const streamingDot = document.getElementById('streamingDot');
        const streamingStatus = document.getElementById('streamingStatus');
        
        if (streamingDot && streamingStatus) {
            if (status === 'connected' && this.streamingEnabled) {
                streamingDot.className = 'streaming-dot';
                streamingStatus.textContent = 'Live';
            } else if (status === 'disconnected') {
                streamingDot.className = 'streaming-dot paused';
                streamingStatus.textContent = 'Disconnected';
            } else {
                streamingDot.className = 'streaming-dot paused';
                streamingStatus.textContent = 'Paused';
            }
        }
    }

    /**
     * Enable or disable streaming
     */
    setStreamingEnabled(enabled) {
        this.streamingEnabled = enabled;
        
        if (enabled && !this.isConnected) {
            this.initialize();
        }
        
        this.notifyConnectionStatus(this.isConnected ? 'connected' : 'disconnected');
    }

    /**
     * Set streaming quality
     */
    setStreamingQuality(quality) {
        this.streamingQuality = quality;
        
        if (this.isConnected) {
            // Send quality update to server
            const qualityUpdate = {
                type: 'quality_update',
                quality: quality
            };
            
            this.websocket.send(JSON.stringify(qualityUpdate));
        }
    }

    /**
     * Get streaming statistics
     */
    getStreamingStats() {
        return {
            isConnected: this.isConnected,
            streamingEnabled: this.streamingEnabled,
            streamingQuality: this.streamingQuality,
            reconnectAttempts: this.reconnectAttempts,
            lastUpdate: this.lastUpdate
        };
    }

    /**
     * Close WebSocket connection
     */
    close() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
            this.isConnected = false;
        }
    }
}

// Initialize real-time streaming when the module is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.CONFIG && window.state) {
        window.realTimeStreaming = new RealTimeStreaming(window.CONFIG);
        
        // Initialize streaming based on customization settings
        if (window.state.customization?.streamingEnabled) {
            window.realTimeStreaming.setStreamingQuality(window.state.customization.streamingQuality);
            window.realTimeStreaming.setStreamingEnabled(true);
        }
    }
});

// Make the class available globally
window.RealTimeStreaming = RealTimeStreaming;