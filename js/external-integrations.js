/**
 * External System Integrations Module
 * Implements API gateway, webhook support, and integration templates
 * for Mission Control Dashboard - Iteration 6
 */

class ExternalIntegrations {
    constructor() {
        this.integrations = new Map();
        this.webhooks = new Map();
        this.apiGateway = null;
        this.init();
    }

    init() {
        this.initializeApiGateway();
        this.loadIntegrationsFromStorage();
        this.setupEventListeners();
        console.log('External Integrations module initialized');
    }

    /**
     * Initialize the API Gateway for handling external service requests
     */
    initializeApiGateway() {
        this.apiGateway = {
            baseUrl: 'https://api.missioncontrol.local/v1',
            endpoints: new Map(),
            rateLimit: {
                maxRequests: 100,
                windowMs: 60000,
                currentRequests: 0,
                lastReset: Date.now()
            },
            cache: new Map(),
            middleware: []
        };

        // Register core endpoints
        this.registerEndpoint('integrations', 'GET', this.handleGetIntegrations.bind(this));
        this.registerEndpoint('integrations', 'POST', this.handleCreateIntegration.bind(this));
        this.registerEndpoint('integrations/:id', 'PUT', this.handleUpdateIntegration.bind(this));
        this.registerEndpoint('integrations/:id', 'DELETE', this.handleDeleteIntegration.bind(this));
        this.registerEndpoint('webhooks', 'POST', this.handleCreateWebhook.bind(this));
        this.registerEndpoint('webhooks/:id', 'DELETE', this.handleDeleteWebhook.bind(this));
        this.registerEndpoint('proxy/:service/*', 'ALL', this.handleProxyRequest.bind(this));
    }

    /**
     * Register an API endpoint with the gateway
     */
    registerEndpoint(path, method, handler) {
        const key = `${method}:${path}`;
        this.apiGateway.endpoints.set(key, handler);
    }

    /**
     * Handle incoming API requests through the gateway
     */
    async handleApiRequest(url, options = {}) {
        const { pathname, searchParams } = new URL(url);
        const method = (options.method || 'GET').toUpperCase();
        
        // Apply rate limiting
        if (!this.checkRateLimit()) {
            throw new Error('Rate limit exceeded');
        }

        // Find matching endpoint
        let matchedHandler = null;
        let pathParams = {};
        
        for (const [key, handler] of this.apiGateway.endpoints.entries()) {
            const [endpointMethod, endpointPath] = key.split(':');
            if (endpointMethod === method || endpointMethod === 'ALL') {
                const match = this.matchPath(endpointPath, pathname);
                if (match) {
                    matchedHandler = handler;
                    pathParams = match;
                    break;
                }
            }
        }

        if (!matchedHandler) {
            throw new Error(`No handler found for ${method} ${pathname}`);
        }

        // Apply middleware
        for (const middleware of this.apiGateway.middleware) {
            await middleware(options);
        }

        // Execute handler
        const request = {
            url: pathname,
            method,
            headers: options.headers || {},
            body: options.body,
            query: Object.fromEntries(searchParams),
            params: pathParams
        };

        return await matchedHandler(request);
    }

    /**
     * Match URL path with parameters
     */
    matchPath(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/').filter(p => p);
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (patternPart.startsWith(':')) {
                params[patternPart.slice(1)] = pathPart;
            } else if (patternPart === '*' && i === patternParts.length - 1) {
                params['*'] = pathParts.slice(i).join('/');
                break;
            } else if (patternPart !== pathPart) {
                return null;
            }
        }
        
        return params;
    }

    /**
     * Check rate limiting
     */
    checkRateLimit() {
        const now = Date.now();
        const windowMs = this.apiGateway.rateLimit.windowMs;
        
        if (now - this.apiGateway.rateLimit.lastReset > windowMs) {
            this.apiGateway.rateLimit.currentRequests = 0;
            this.apiGateway.rateLimit.lastReset = now;
        }
        
        if (this.apiGateway.rateLimit.currentRequests >= this.apiGateway.rateLimit.maxRequests) {
            return false;
        }
        
        this.apiGateway.rateLimit.currentRequests++;
        return true;
    }

    /**
     * Handle GET /integrations request
     */
    async handleGetIntegrations(request) {
        const integrationsArray = Array.from(this.integrations.values()).map(integration => ({
            id: integration.id,
            name: integration.name,
            type: integration.type,
            status: integration.status,
            lastSync: integration.lastSync,
            config: this.maskSensitiveConfig(integration.config)
        }));
        
        return {
            success: true,
            data: integrationsArray
        };
    }

    /**
     * Handle POST /integrations request
     */
    async handleCreateIntegration(request) {
        try {
            const integrationData = JSON.parse(request.body);
            const integration = this.createIntegration(integrationData);
            
            return {
                success: true,
                data: {
                    id: integration.id,
                    name: integration.name,
                    type: integration.type,
                    status: integration.status
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle PUT /integrations/:id request
     */
    async handleUpdateIntegration(request) {
        try {
            const integrationId = request.params.id;
            const updateData = JSON.parse(request.body);
            
            if (!this.integrations.has(integrationId)) {
                throw new Error('Integration not found');
            }
            
            const updatedIntegration = this.updateIntegration(integrationId, updateData);
            
            return {
                success: true,
                data: {
                    id: updatedIntegration.id,
                    name: updatedIntegration.name,
                    type: updatedIntegration.type,
                    status: updatedIntegration.status
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle DELETE /integrations/:id request
     */
    async handleDeleteIntegration(request) {
        try {
            const integrationId = request.params.id;
            
            if (!this.integrations.has(integrationId)) {
                throw new Error('Integration not found');
            }
            
            this.deleteIntegration(integrationId);
            
            return {
                success: true,
                message: 'Integration deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle POST /webhooks request
     */
    async handleCreateWebhook(request) {
        try {
            const webhookData = JSON.parse(request.body);
            const webhook = this.createWebhook(webhookData);
            
            return {
                success: true,
                data: {
                    id: webhook.id,
                    url: webhook.url,
                    events: webhook.events,
                    active: webhook.active
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle DELETE /webhooks/:id request
     */
    async handleDeleteWebhook(request) {
        try {
            const webhookId = request.params.id;
            
            if (!this.webhooks.has(webhookId)) {
                throw new Error('Webhook not found');
            }
            
            this.deleteWebhook(webhookId);
            
            return {
                success: true,
                message: 'Webhook deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle proxy requests to external services
     */
    async handleProxyRequest(request) {
        try {
            const service = request.params.service;
            const path = request.params['*'];
            const integration = this.findIntegrationByService(service);
            
            if (!integration) {
                throw new Error(`Service ${service} not configured`);
            }
            
            // Validate authentication
            if (!this.validateServiceAuth(integration, request.headers)) {
                throw new Error('Authentication failed');
            }
            
            // Make proxied request
            const response = await this.makeProxiedRequest(
                integration,
                path,
                request.method,
                request.body,
                request.headers
            );
            
            return {
                success: true,
                data: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a new integration
     */
    createIntegration(data) {
        const { name, type, config, template } = data;
        
        // Validate integration type
        if (!this.isValidIntegrationType(type)) {
            throw new Error(`Invalid integration type: ${type}`);
        }
        
        // Apply template if provided
        let finalConfig = config;
        if (template) {
            finalConfig = this.applyIntegrationTemplate(template, config);
        }
        
        // Validate configuration
        this.validateIntegrationConfig(type, finalConfig);
        
        const integration = {
            id: this.generateId(),
            name,
            type,
            config: finalConfig,
            status: 'inactive',
            lastSync: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.integrations.set(integration.id, integration);
        this.saveIntegrationsToStorage();
        
        // Initialize integration
        this.initializeIntegration(integration);
        
        return integration;
    }

    /**
     * Update an existing integration
     */
    updateIntegration(id, updateData) {
        const integration = this.integrations.get(id);
        if (!integration) {
            throw new Error('Integration not found');
        }
        
        // Update fields
        if (updateData.name !== undefined) integration.name = updateData.name;
        if (updateData.config !== undefined) {
            this.validateIntegrationConfig(integration.type, updateData.config);
            integration.config = updateData.config;
        }
        if (updateData.status !== undefined) integration.status = updateData.status;
        
        integration.updatedAt = new Date().toISOString();
        this.integrations.set(id, integration);
        this.saveIntegrationsToStorage();
        
        return integration;
    }

    /**
     * Delete an integration
     */
    deleteIntegration(id) {
        if (!this.integrations.has(id)) {
            throw new Error('Integration not found');
        }
        
        this.integrations.delete(id);
        this.saveIntegrationsToStorage();
    }

    /**
     * Create a new webhook
     */
    createWebhook(data) {
        const { url, events, active = true, secret } = data;
        
        // Validate URL
        try {
            new URL(url);
        } catch (error) {
            throw new Error('Invalid webhook URL');
        }
        
        // Validate events
        if (!Array.isArray(events) || events.length === 0) {
            throw new Error('Webhook must have at least one event');
        }
        
        const webhook = {
            id: this.generateId(),
            url,
            events,
            active,
            secret: secret || this.generateSecret(),
            createdAt: new Date().toISOString(),
            lastTriggered: null
        };
        
        this.webhooks.set(webhook.id, webhook);
        this.saveWebhooksToStorage();
        
        return webhook;
    }

    /**
     * Delete a webhook
     */
    deleteWebhook(id) {
        if (!this.webhooks.has(id)) {
            throw new Error('Webhook not found');
        }
        
        this.webhooks.delete(id);
        this.saveWebhooksToStorage();
    }

    /**
     * Trigger a webhook event
     */
    async triggerWebhookEvent(eventType, eventData) {
        const webhooksToTrigger = [];
        
        for (const webhook of this.webhooks.values()) {
            if (webhook.active && webhook.events.includes(eventType)) {
                webhooksToTrigger.push(webhook);
            }
        }
        
        const promises = webhooksToTrigger.map(webhook => 
            this.sendWebhook(webhook, eventType, eventData)
        );
        
        await Promise.allSettled(promises);
    }

    /**
     * Send a webhook notification
     */
    async sendWebhook(webhook, eventType, eventData) {
        try {
            const payload = {
                event: eventType,
                data: eventData,
                timestamp: new Date().toISOString(),
                webhookId: webhook.id
            };
            
            const signature = this.generateWebhookSignature(webhook.secret, JSON.stringify(payload));
            
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': eventType
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                webhook.lastTriggered = new Date().toISOString();
                this.webhooks.set(webhook.id, webhook);
                this.saveWebhooksToStorage();
                return true;
            } else {
                console.error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
                return false;
            }
        } catch (error) {
            console.error(`Webhook delivery error: ${error.message}`);
            return false;
        }
    }

    /**
     * Generate webhook signature
     */
    generateWebhookSignature(secret, payload) {
        // In a real implementation, this would use proper HMAC
        // For browser environment, we'll use a simple hash
        return btoa(secret + payload).substring(0, 32);
    }

    /**
     * Initialize an integration
     */
    async initializeIntegration(integration) {
        try {
            // Test connection
            await this.testIntegrationConnection(integration);
            
            // Set status to active
            integration.status = 'active';
            this.integrations.set(integration.id, integration);
            this.saveIntegrationsToStorage();
            
            console.log(`Integration ${integration.name} initialized successfully`);
        } catch (error) {
            console.error(`Failed to initialize integration ${integration.name}:`, error);
            integration.status = 'error';
            integration.error = error.message;
            this.integrations.set(integration.id, integration);
            this.saveIntegrationsToStorage();
        }
    }

    /**
     * Test integration connection
     */
    async testIntegrationConnection(integration) {
        // This would be implemented per integration type
        // For now, we'll simulate a successful connection
        return true;
    }

    /**
     * Sync data from an integration
     */
    async syncIntegration(id) {
        const integration = this.integrations.get(id);
        if (!integration) {
            throw new Error('Integration not found');
        }
        
        if (integration.status !== 'active') {
            throw new Error('Integration is not active');
        }
        
        try {
            // Perform sync based on integration type
            const syncedData = await this.performIntegrationSync(integration);
            
            integration.lastSync = new Date().toISOString();
            this.integrations.set(id, integration);
            this.saveIntegrationsToStorage();
            
            // Trigger webhook for sync completion
            await this.triggerWebhookEvent('integration.sync.completed', {
                integrationId: id,
                integrationName: integration.name,
                recordsSynced: syncedData?.length || 0
            });
            
            return syncedData;
        } catch (error) {
            console.error(`Sync failed for integration ${integration.name}:`, error);
            
            // Trigger webhook for sync failure
            await this.triggerWebhookEvent('integration.sync.failed', {
                integrationId: id,
                integrationName: integration.name,
                error: error.message
            });
            
            throw error;
        }
    }

    /**
     * Perform integration-specific sync
     */
    async performIntegrationSync(integration) {
        // This would be implemented per integration type
        // Return mock data for now
        return [];
    }

    /**
     * Validate integration type
     */
    isValidIntegrationType(type) {
        const validTypes = [
            'github', 'gitlab', 'jira', 'trello', 'asana', 
            'slack', 'discord', 'email', 'calendar', 'custom'
        ];
        return validTypes.includes(type);
    }

    /**
     * Validate integration configuration
     */
    validateIntegrationConfig(type, config) {
        // Basic validation - specific validation would be per type
        if (!config || typeof config !== 'object') {
            throw new Error('Invalid configuration object');
        }
        
        // Required fields validation per type would go here
    }

    /**
     * Apply integration template
     */
    applyIntegrationTemplate(templateName, customConfig) {
        const templates = {
            github: {
                apiUrl: 'https://api.github.com',
                authType: 'token',
                scopes: ['repo', 'user'],
                webhookEvents: ['push', 'pull_request', 'issues']
            },
            jira: {
                apiUrl: 'https://your-domain.atlassian.net/rest/api/3',
                authType: 'basic',
                projectKey: '',
                webhookEvents: ['issue_created', 'issue_updated', 'comment_created']
            },
            slack: {
                apiUrl: 'https://slack.com/api',
                authType: 'token',
                botToken: '',
                webhookEvents: ['message', 'reaction_added', 'channel_join']
            }
        };
        
        const template = templates[templateName];
        if (!template) {
            throw new Error(`Unknown template: ${templateName}`);
        }
        
        return { ...template, ...customConfig };
    }

    /**
     * Find integration by service name
     */
    findIntegrationByService(service) {
        for (const integration of this.integrations.values()) {
            if (integration.config.serviceName === service) {
                return integration;
            }
        }
        return null;
    }

    /**
     * Validate service authentication
     */
    validateServiceAuth(integration, headers) {
        // This would validate the authentication headers against the integration config
        // For now, we'll assume it's valid
        return true;
    }

    /**
     * Make proxied request to external service
     */
    async makeProxiedRequest(integration, path, method, body, headers) {
        // This would make the actual request to the external service
        // For now, we'll return mock data
        return { success: true, data: {} };
    }

    /**
     * Mask sensitive configuration values
     */
    maskSensitiveConfig(config) {
        if (!config || typeof config !== 'object') return config;
        
        const masked = { ...config };
        const sensitiveKeys = ['token', 'password', 'secret', 'apiKey', 'accessToken'];
        
        for (const key of sensitiveKeys) {
            if (masked[key]) {
                masked[key] = '********';
            }
        }
        
        return masked;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'int_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Generate webhook secret
     */
    generateSecret() {
        return Array.from({ length: 32 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    /**
     * Load integrations from localStorage
     */
    loadIntegrationsFromStorage() {
        try {
            const savedIntegrations = localStorage.getItem('missionControlIntegrations');
            if (savedIntegrations) {
                const parsed = JSON.parse(savedIntegrations);
                for (const integration of parsed) {
                    this.integrations.set(integration.id, integration);
                }
            }
            
            const savedWebhooks = localStorage.getItem('missionControlWebhooks');
            if (savedWebhooks) {
                const parsed = JSON.parse(savedWebhooks);
                for (const webhook of parsed) {
                    this.webhooks.set(webhook.id, webhook);
                }
            }
        } catch (error) {
            console.error('Error loading integrations from storage:', error);
        }
    }

    /**
     * Save integrations to localStorage
     */
    saveIntegrationsToStorage() {
        try {
            const integrationsArray = Array.from(this.integrations.values());
            localStorage.setItem('missionControlIntegrations', JSON.stringify(integrationsArray));
        } catch (error) {
            console.error('Error saving integrations to storage:', error);
        }
    }

    /**
     * Save webhooks to localStorage
     */
    saveWebhooksToStorage() {
        try {
            const webhooksArray = Array.from(this.webhooks.values());
            localStorage.setItem('missionControlWebhooks', JSON.stringify(webhooksArray));
        } catch (error) {
            console.error('Error saving webhooks to storage:', error);
        }
    }

    /**
     * Setup event listeners for integration events
     */
    setupEventListeners() {
        // Listen for project updates to trigger webhooks
        document.addEventListener('projectUpdated', (event) => {
            this.triggerWebhookEvent('project.updated', event.detail);
        });
        
        document.addEventListener('projectCreated', (event) => {
            this.triggerWebhookEvent('project.created', event.detail);
        });
        
        document.addEventListener('projectDeleted', (event) => {
            this.triggerWebhookEvent('project.deleted', event.detail);
        });
        
        document.addEventListener('agentStatusChanged', (event) => {
            this.triggerWebhookEvent('agent.status.changed', event.detail);
        });
    }

    /**
     * Get integration by ID
     */
    getIntegration(id) {
        return this.integrations.get(id);
    }

    /**
     * Get all integrations
     */
    getAllIntegrations() {
        return Array.from(this.integrations.values());
    }

    /**
     * Get webhook by ID
     */
    getWebhook(id) {
        return this.webhooks.get(id);
    }

    /**
     * Get all webhooks
     */
    getAllWebhooks() {
        return Array.from(this.webhooks.values());
    }

    /**
     * Add middleware to API gateway
     */
    addMiddleware(middleware) {
        this.apiGateway.middleware.push(middleware);
    }

    /**
     * Remove middleware from API gateway
     */
    removeMiddleware(middleware) {
        const index = this.apiGateway.middleware.indexOf(middleware);
        if (index !== -1) {
            this.apiGateway.middleware.splice(index, 1);
        }
    }

    /**
     * Clear all integrations
     */
    clearAllIntegrations() {
        this.integrations.clear();
        localStorage.removeItem('missionControlIntegrations');
    }

    /**
     * Clear all webhooks
     */
    clearAllWebhooks() {
        this.webhooks.clear();
        localStorage.removeItem('missionControlWebhooks');
    }

    /**
     * Export integrations configuration
     */
    exportIntegrations() {
        const integrations = Array.from(this.integrations.values()).map(int => ({
            ...int,
            config: this.maskSensitiveConfig(int.config)
        }));
        return JSON.stringify(integrations, null, 2);
    }

    /**
     * Import integrations configuration
     */
    importIntegrations(jsonString) {
        try {
            const integrations = JSON.parse(jsonString);
            for (const integration of integrations) {
                // Validate before importing
                this.validateIntegrationConfig(integration.type, integration.config);
                this.integrations.set(integration.id, integration);
            }
            this.saveIntegrationsToStorage();
            return true;
        } catch (error) {
            console.error('Error importing integrations:', error);
            return false;
        }
    }

    /**
     * Get integration statistics
     */
    getIntegrationStats() {
        const stats = {
            total: this.integrations.size,
            active: 0,
            inactive: 0,
            error: 0,
            byType: {}
        };
        
        for (const integration of this.integrations.values()) {
            if (integration.status === 'active') stats.active++;
            else if (integration.status === 'inactive') stats.inactive++;
            else if (integration.status === 'error') stats.error++;
            
            stats.byType[integration.type] = (stats.byType[integration.type] || 0) + 1;
        }
        
        return stats;
    }

    /**
     * Get webhook statistics
     */
    getWebhookStats() {
        const stats = {
            total: this.webhooks.size,
            active: 0,
            inactive: 0,
            triggered: 0
        };
        
        for (const webhook of this.webhooks.values()) {
            if (webhook.active) stats.active++;
            else stats.inactive++;
            if (webhook.lastTriggered) stats.triggered++;
        }
        
        return stats;
    }

    /**
     * Cleanup old webhook deliveries
     */
    cleanupOldWebhooks(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        for (const [id, webhook] of this.webhooks.entries()) {
            if (webhook.lastTriggered && new Date(webhook.lastTriggered) < cutoffDate) {
                // Optionally archive instead of delete
                this.webhooks.delete(id);
            }
        }
        
        this.saveWebhooksToStorage();
    }

    /**
     * Validate webhook URL
     */
    async validateWebhookUrl(url) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    test: true,
                    message: 'Webhook validation test from Mission Control'
                })
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get supported integration types
     */
    getSupportedIntegrationTypes() {
        return [
            { id: 'github', name: 'GitHub', icon: 'github', description: 'Connect to GitHub repositories' },
            { id: 'gitlab', name: 'GitLab', icon: 'gitlab', description: 'Connect to GitLab projects' },
            { id: 'jira', name: 'Jira', icon: 'jira', description: 'Connect to Jira issues and projects' },
            { id: 'trello', name: 'Trello', icon: 'trello', description: 'Connect to Trello boards' },
            { id: 'asana', name: 'Asana', icon: 'asana', description: 'Connect to Asana tasks' },
            { id: 'slack', name: 'Slack', icon: 'slack', description: 'Connect to Slack channels' },
            { id: 'discord', name: 'Discord', icon: 'discord', description: 'Connect to Discord servers' },
            { id: 'email', name: 'Email', icon: 'email', description: 'Connect to email accounts' },
            { id: 'calendar', name: 'Calendar', icon: 'calendar', description: 'Connect to calendar services' },
            { id: 'custom', name: 'Custom API', icon: 'api', description: 'Connect to custom REST APIs' }
        ];
    }

    /**
     * Get integration templates
     */
    getIntegrationTemplates() {
        return [
            {
                id: 'github-repo',
                name: 'GitHub Repository',
                type: 'github',
                description: 'Monitor a GitHub repository for updates',
                config: {
                    owner: '',
                    repo: '',
                    events: ['push', 'pull_request', 'issues']
                }
            },
            {
                id: 'jira-project',
                name: 'Jira Project',
                type: 'jira',
                description: 'Sync Jira project issues and status',
                config: {
                    projectKey: '',
                    issueTypes: ['Bug', 'Task', 'Story'],
                    syncFrequency: 'hourly'
                }
            },
            {
                id: 'slack-channel',
                name: 'Slack Channel',
                type: 'slack',
                description: 'Monitor Slack channel activity',
                config: {
                    channelId: '',
                    monitorMessages: true,
                    monitorReactions: true,
                    postNotifications: true
                }
            }
        ];
    }

    /**
     * Test integration connection manually
     */
    async testIntegrationConnectionManually(integrationId) {
        const integration = this.integrations.get(integrationId);
        if (!integration) {
            throw new Error('Integration not found');
        }
        
        try {
            await this.testIntegrationConnection(integration);
            return { success: true, message: 'Connection test successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Get integration logs
     */
    getIntegrationLogs(integrationId, limit = 100) {
        // In a real implementation, this would retrieve actual logs
        // For now, return mock logs
        return [
            {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'Integration initialized',
                integrationId
            }
        ].slice(0, limit);
    }

    /**
     * Clear integration logs
     */
    clearIntegrationLogs(integrationId) {
        // In a real implementation, this would clear actual logs
        console.log(`Clearing logs for integration ${integrationId}`);
    }

    /**
     * Enable debug mode for integration
     */
    enableDebugMode(integrationId) {
        const integration = this.integrations.get(integrationId);
        if (integration) {
            integration.debug = true;
            this.integrations.set(integrationId, integration);
            this.saveIntegrationsToStorage();
        }
    }

    /**
     * Disable debug mode for integration
     */
    disableDebugMode(integrationId) {
        const integration = this.integrations.get(integrationId);
        if (integration) {
            integration.debug = false;
            this.integrations.set(integrationId, integration);
            this.saveIntegrationsToStorage();
        }
    }

    /**
     * Get debug logs for integration
     */
    getDebugLogs(integrationId) {
        // Return debug logs if debug mode is enabled
        const integration = this.integrations.get(integrationId);
        if (integration && integration.debug) {
            // Return mock debug logs
            return [
                {
                    timestamp: new Date().toISOString(),
                    level: 'debug',
                    message: 'Debug mode enabled',
                    integrationId
                }
            ];
        }
        return [];
    }
}

// Initialize the external integrations module when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.externalIntegrations = new ExternalIntegrations();
    
    // Make functions available globally for inline event handlers
    window.createIntegration = (data) => window.externalIntegrations.createIntegration(data);
    window.updateIntegration = (id, data) => window.externalIntegrations.updateIntegration(id, data);
    window.deleteIntegration = (id) => window.externalIntegrations.deleteIntegration(id);
    window.syncIntegration = (id) => window.externalIntegrations.syncIntegration(id);
    window.createWebhook = (data) => window.externalIntegrations.createWebhook(data);
    window.deleteWebhook = (id) => window.externalIntegrations.deleteWebhook(id);
    window.getAllIntegrations = () => window.externalIntegrations.getAllIntegrations();
    window.getAllWebhooks = () => window.externalIntegrations.getAllWebhooks();
    window.getIntegrationStats = () => window.externalIntegrations.getIntegrationStats();
    window.getWebhookStats = () => window.externalIntegrations.getWebhookStats();
    window.getSupportedIntegrationTypes = () => window.externalIntegrations.getSupportedIntegrationTypes();
    window.getIntegrationTemplates = () => window.externalIntegrations.getIntegrationTemplates();
    window.testIntegrationConnectionManually = (id) => window.externalIntegrations.testIntegrationConnectionManually(id);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExternalIntegrations;
}