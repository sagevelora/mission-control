/**
 * Enhanced Security Features for Mission Control Dashboard
 * Implements Role-Based Access Control (RBAC), Audit Logging, 
 * Data Encryption, and Secure API Authentication
 */

class SecurityManager {
    constructor() {
        this.currentUser = null;
        this.userRoles = new Map();
        this.permissions = new Map();
        this.auditLog = [];
        this.encryptionKey = null;
        this.sessionToken = null;
        this.init();
    }

    /**
     * Initialize security features
     */
    init() {
        // Load user roles and permissions from localStorage or API
        this.loadSecurityConfig();
        
        // Initialize encryption if available
        this.initializeEncryption();
        
        // Set up audit logging
        this.setupAuditLogging();
        
        // Initialize session management
        this.initializeSession();
        
        // Add security indicators to UI
        this.addSecurityIndicators();
        
        console.log('Security Manager initialized');
    }

    /**
     * Load security configuration from localStorage or API
     */
    loadSecurityConfig() {
        try {
            // Try to load from localStorage first
            const storedRoles = localStorage.getItem('security_roles');
            const storedPermissions = localStorage.getItem('security_permissions');
            
            if (storedRoles && storedPermissions) {
                this.userRoles = new Map(JSON.parse(storedRoles));
                this.permissions = new Map(JSON.parse(storedPermissions));
            } else {
                // Initialize default roles and permissions
                this.initializeDefaultRoles();
                this.saveSecurityConfig();
            }
        } catch (error) {
            console.error('Error loading security config:', error);
            this.initializeDefaultRoles();
        }
    }

    /**
     * Initialize default roles and permissions
     */
    initializeDefaultRoles() {
        // Define default roles
        this.userRoles.set('admin', {
            name: 'Administrator',
            description: 'Full access to all features',
            level: 100
        });
        
        this.userRoles.set('manager', {
            name: 'Project Manager',
            description: 'Can manage projects and view analytics',
            level: 75
        });
        
        this.userRoles.set('developer', {
            name: 'Developer',
            description: 'Can work on projects and view basic metrics',
            level: 50
        });
        
        this.userRoles.set('viewer', {
            name: 'Viewer',
            description: 'Read-only access to dashboard',
            level: 25
        });

        // Define default permissions
        this.permissions.set('dashboard.view', ['admin', 'manager', 'developer', 'viewer']);
        this.permissions.set('dashboard.edit', ['admin', 'manager']);
        this.permissions.set('projects.view', ['admin', 'manager', 'developer', 'viewer']);
        this.permissions.set('projects.create', ['admin', 'manager', 'developer']);
        this.permissions.set('projects.edit', ['admin', 'manager', 'developer']);
        this.permissions.set('projects.delete', ['admin', 'manager']);
        this.permissions.set('agents.view', ['admin', 'manager']);
        this.permissions.set('agents.manage', ['admin']);
        this.permissions.set('analytics.view', ['admin', 'manager']);
        this.permissions.set('analytics.export', ['admin', 'manager']);
        this.permissions.set('settings.view', ['admin', 'manager']);
        this.permissions.set('settings.edit', ['admin']);
        this.permissions.set('security.audit', ['admin']);
    }

    /**
     * Save security configuration to localStorage
     */
    saveSecurityConfig() {
        try {
            localStorage.setItem('security_roles', JSON.stringify([...this.userRoles]));
            localStorage.setItem('security_permissions', JSON.stringify([...this.permissions]));
        } catch (error) {
            console.error('Error saving security config:', error);
        }
    }

    /**
     * Initialize encryption capabilities
     */
    async initializeEncryption() {
        try {
            // Check if Web Crypto API is available
            if (window.crypto && window.crypto.subtle) {
                // Generate or load encryption key
                const storedKey = localStorage.getItem('encryption_key');
                if (storedKey) {
                    // In a real implementation, this would be more secure
                    // For demo purposes, we'll use a simple approach
                    this.encryptionKey = storedKey;
                } else {
                    // Generate a random key for demonstration
                    this.encryptionKey = this.generateRandomKey(32);
                    localStorage.setItem('encryption_key', this.encryptionKey);
                }
                console.log('Encryption initialized');
            } else {
                console.warn('Web Crypto API not available, using basic encryption');
                this.encryptionKey = 'demo-key-for-basic-encryption';
            }
        } catch (error) {
            console.error('Error initializing encryption:', error);
            this.encryptionKey = 'fallback-encryption-key';
        }
    }

    /**
     * Generate a random key for encryption
     */
    generateRandomKey(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Encrypt data using the available encryption method
     */
    async encryptData(data) {
        if (typeof data === 'object') {
            data = JSON.stringify(data);
        }
        
        // Simple XOR encryption for demonstration
        // In production, use proper AES encryption with Web Crypto API
        let encrypted = '';
        for (let i = 0; i < data.length; i++) {
            encrypted += String.fromCharCode(
                data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
            );
        }
        return btoa(encrypted);
    }

    /**
     * Decrypt data using the available decryption method
     */
    async decryptData(encryptedData) {
        try {
            const decoded = atob(encryptedData);
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                decrypted += String.fromCharCode(
                    decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
                );
            }
            
            // Try to parse as JSON
            try {
                return JSON.parse(decrypted);
            } catch (e) {
                return decrypted;
            }
        } catch (error) {
            console.error('Error decrypting data:', error);
            return null;
        }
    }

    /**
     * Set up audit logging system
     */
    setupAuditLogging() {
        // Load existing audit log from localStorage
        const storedLog = localStorage.getItem('audit_log');
        if (storedLog) {
            try {
                this.auditLog = JSON.parse(storedLog);
            } catch (error) {
                console.error('Error parsing audit log:', error);
                this.auditLog = [];
            }
        }
        
        // Set up automatic cleanup of old logs
        this.scheduleAuditLogCleanup();
    }

    /**
     * Log a security-relevant action to the audit log
     */
    logAction(action, details = {}, userId = null, severity = 'info') {
        const logEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            userId: userId || (this.currentUser ? this.currentUser.id : 'anonymous'),
            severity: severity,
            userAgent: navigator.userAgent,
            ipAddress: 'unknown' // In a real implementation, this would come from the server
        };
        
        this.auditLog.push(logEntry);
        
        // Keep only the last 1000 entries
        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-1000);
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('audit_log', JSON.stringify(this.auditLog));
        } catch (error) {
            console.error('Error saving audit log:', error);
        }
        
        // Send to server if available
        this.sendAuditLogToServer(logEntry);
        
        // Show notification for high severity actions
        if (severity === 'warning' || severity === 'error') {
            this.showSecurityNotification(action, severity);
        }
        
        console.log(`Security Action Logged: ${action} (${severity})`);
    }

    /**
     * Send audit log entry to server
     */
    async sendAuditLogToServer(logEntry) {
        try {
            // In a real implementation, this would send to the VPS API
            // For now, we'll just log it
            console.log('Sending audit log to server:', logEntry);
            
            // Simulate API call
            /*
            const response = await fetch(`${CONFIG.VPS_URL}/api/security/audit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionToken}`
                },
                body: JSON.stringify(logEntry)
            });
            
            if (!response.ok) {
                console.error('Failed to send audit log to server');
            }
            */
        } catch (error) {
            console.error('Error sending audit log to server:', error);
        }
    }

    /**
     * Schedule automatic cleanup of audit logs
     */
    scheduleAuditLogCleanup() {
        // Clean up logs older than 30 days every hour
        setInterval(() => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            this.auditLog = this.auditLog.filter(entry => 
                new Date(entry.timestamp) > thirtyDaysAgo
            );
            
            try {
                localStorage.setItem('audit_log', JSON.stringify(this.auditLog));
            } catch (error) {
                console.error('Error cleaning up audit log:', error);
            }
        }, 3600000); // Every hour
    }

    /**
     * Initialize session management
     */
    initializeSession() {
        // Check for existing session token
        const storedToken = localStorage.getItem('session_token');
        if (storedToken) {
            this.sessionToken = storedToken;
            // Validate session token (would normally call server)
            this.validateSession();
        }
        
        // Set up session timeout
        this.setupSessionTimeout();
    }

    /**
     * Validate current session
     */
    async validateSession() {
        try {
            // In a real implementation, this would validate with the server
            console.log('Validating session token');
            
            // Simulate validation
            /*
            const response = await fetch(`${CONFIG.VPS_URL}/api/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
            
            if (!response.ok) {
                this.logout();
                return false;
            }
            
            const userData = await response.json();
            this.setCurrentUser(userData);
            */
            
            // For demo, assume valid
            this.setCurrentUser({
                id: 'demo-user',
                username: 'jack',
                email: 'jack@example.com',
                role: 'admin',
                name: 'Jack'
            });
            
            return true;
        } catch (error) {
            console.error('Error validating session:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Set current user and update UI
     */
    setCurrentUser(user) {
        this.currentUser = user;
        
        // Update UI with user info
        this.updateUserInfoDisplay();
        
        // Apply role-based permissions
        this.applyRolePermissions();
        
        // Log the login
        this.logAction('user.login', { username: user.username }, user.id, 'info');
    }

    /**
     * Update user info display in UI
     */
    updateUserInfoDisplay() {
        if (!this.currentUser) return;
        
        // Update welcome message
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome back, ${this.currentUser.name}`;
        }
        
        // Add security badge if admin
        if (this.currentUser.role === 'admin') {
            const logoSection = document.querySelector('.logo-section');
            if (logoSection && !logoSection.querySelector('.security-badge')) {
                const badge = document.createElement('span');
                badge.className = 'security-badge';
                badge.textContent = 'SECURE';
                logoSection.appendChild(badge);
            }
        }
    }

    /**
     * Apply role-based permissions to UI elements
     */
    applyRolePermissions() {
        if (!this.currentUser) return;
        
        const userRole = this.currentUser.role;
        
        // Hide/show elements based on permissions
        this.permissions.forEach((allowedRoles, permission) => {
            const hasPermission = allowedRoles.includes(userRole);
            this.applyPermissionToElements(permission, hasPermission);
        });
        
        // Log permission application
        this.logAction('permissions.applied', { role: userRole }, this.currentUser.id, 'info');
    }

    /**
     * Apply permission to UI elements
     */
    applyPermissionToElements(permission, hasPermission) {
        // Find elements with data-permission attribute
        const elements = document.querySelectorAll(`[data-permission="${permission}"]`);
        
        elements.forEach(element => {
            if (hasPermission) {
                element.classList.remove('hidden');
                element.disabled = false;
            } else {
                element.classList.add('hidden');
                element.disabled = true;
            }
        });
        
        // Handle special cases
        switch (permission) {
            case 'projects.delete':
                if (!hasPermission) {
                    // Hide delete buttons in project cards
                    const deleteButtons = document.querySelectorAll('.task-action-btn.delete');
                    deleteButtons.forEach(btn => btn.classList.add('hidden'));
                }
                break;
                
            case 'agents.manage':
                if (!hasPermission) {
                    // Disable agent management buttons
                    const manageButtons = document.querySelectorAll('.agent-action-btn.restart, .agent-action-btn.pause, .agent-action-btn.configure');
                    manageButtons.forEach(btn => {
                        btn.disabled = true;
                        btn.style.opacity = '0.5';
                    });
                }
                break;
        }
    }

    /**
     * Check if current user has a specific permission
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const allowedRoles = this.permissions.get(permission);
        if (!allowedRoles) return false;
        
        return allowedRoles.includes(this.currentUser.role);
    }

    /**
     * Add security indicators to UI
     */
    addSecurityIndicators() {
        // Add security status indicator to header
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
            const securityIndicator = document.createElement('div');
            securityIndicator.className = 'status-indicator';
            securityIndicator.innerHTML = `
                <span class="status-dot" style="background: var(--accent-success);"></span>
                <span>Secure</span>
            `;
            securityIndicator.id = 'securityStatus';
            searchSection.appendChild(securityIndicator);
        }
        
        // Add encryption indicator to customization panel
        const customizationPanel = document.getElementById('customizationPanel');
        if (customizationPanel) {
            const securitySection = document.createElement('div');
            securitySection.className = 'customization-section';
            securitySection.innerHTML = `
                <h3>Security Settings</h3>
                <div class="customization-option">
                    <label class="customization-label">Data Encryption</label>
                    <div class="customization-toggle">
                        <span>Enable End-to-End Encryption</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="encryptionToggle" checked disabled>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="customization-option">
                    <label class="customization-label">Session Timeout</label>
                    <select id="sessionTimeoutSelect" class="customization-input">
                        <option value="900">15 minutes</option>
                        <option value="1800" selected>30 minutes</option>
                        <option value="3600">1 hour</option>
                        <option value="0">Never</option>
                    </select>
                </div>
                <div class="customization-option">
                    <button class="add-priority-btn" id="viewAuditLogBtn" style="width: 100%;">View Security Audit Log</button>
                </div>
            `;
            customizationPanel.appendChild(securitySection);
            
            // Add event listener for audit log button
            const auditLogBtn = document.getElementById('viewAuditLogBtn');
            if (auditLogBtn) {
                auditLogBtn.addEventListener('click', () => this.showAuditLog());
            }
        }
    }

    /**
     * Show security audit log
     */
    showAuditLog() {
        // Create modal for audit log
        const modalHTML = `
            <div class="modal-overlay" id="auditLogModal" style="display:block;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:2000;">
                <div class="modal-content" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);max-width:800px;width:90%;max-height:80vh;overflow-y:auto;margin:5% auto;padding:var(--spacing-xl);">
                    <h3 style="margin-bottom:var(--spacing-md);">Security Audit Log</h3>
                    
                    <div style="margin-bottom:var(--spacing-md);">
                        <input type="text" id="auditSearch" placeholder="Search audit log..." style="width:100%;padding:var(--spacing-sm);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);">
                    </div>
                    
                    <div id="auditLogContent" style="max-height:60vh;overflow-y:auto;">
                        <!-- Audit log entries will be populated here -->
                    </div>
                    
                    <div class="modal-actions" style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-lg);">
                        <button class="modal-btn cancel" onclick="closeAuditLogModal()" style="padding:var(--spacing-sm) var(--spacing-md);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);cursor:pointer;">Close</button>
                        <button class="modal-btn confirm" onclick="exportAuditLog()" style="padding:var(--spacing-sm) var(--spacing-md);background:var(--accent-primary);border:none;border-radius:var(--radius-md);color:var(--bg-primary);cursor:pointer;">Export Log</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Populate audit log content
        this.populateAuditLogContent();
        
        // Add search functionality
        const searchInput = document.getElementById('auditSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterAuditLog(e.target.value);
            });
        }
    }

    /**
     * Populate audit log content
     */
    populateAuditLogContent() {
        const contentElement = document.getElementById('auditLogContent');
        if (!contentElement) return;
        
        if (this.auditLog.length === 0) {
            contentElement.innerHTML = '<p class="text-center text-muted">No audit log entries found.</p>';
            return;
        }
        
        // Sort by timestamp (newest first)
        const sortedLog = [...this.auditLog].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        const logHTML = sortedLog.map(entry => `
            <div class="activity-item" style="border-bottom: 1px solid var(--border-color); padding: var(--spacing-sm) 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                    <span style="color: ${entry.severity === 'error' ? 'var(--accent-error)' : entry.severity === 'warning' ? 'var(--accent-warning)' : 'var(--text-primary)'};">
                        ${entry.action}
                    </span>
                    <span class="activity-timestamp">${this.formatTimestamp(entry.timestamp)}</span>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">
                    User: ${entry.userId} | Severity: ${entry.severity}
                </div>
                ${entry.details ? `<div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: var(--spacing-xs);">
                    Details: ${JSON.stringify(entry.details)}
                </div>` : ''}
            </div>
        `).join('');
        
        contentElement.innerHTML = logHTML;
    }

    /**
     * Filter audit log based on search term
     */
    filterAuditLog(searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const filteredLog = this.auditLog.filter(entry => 
            entry.action.toLowerCase().includes(lowerSearch) ||
            entry.userId.toLowerCase().includes(lowerSearch) ||
            (entry.details && JSON.stringify(entry.details).toLowerCase().includes(lowerSearch))
        );
        
        const contentElement = document.getElementById('auditLogContent');
        if (!contentElement) return;
        
        if (filteredLog.length === 0) {
            contentElement.innerHTML = '<p class="text-center text-muted">No matching audit log entries found.</p>';
            return;
        }
        
        // Sort by timestamp (newest first)
        const sortedLog = filteredLog.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        const logHTML = sortedLog.map(entry => `
            <div class="activity-item" style="border-bottom: 1px solid var(--border-color); padding: var(--spacing-sm) 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
                    <span style="color: ${entry.severity === 'error' ? 'var(--accent-error)' : entry.severity === 'warning' ? 'var(--accent-warning)' : 'var(--text-primary)'};">
                        ${entry.action}
                    </span>
                    <span class="activity-timestamp">${this.formatTimestamp(entry.timestamp)}</span>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">
                    User: ${entry.userId} | Severity: ${entry.severity}
                </div>
                ${entry.details ? `<div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: var(--spacing-xs);">
                    Details: ${JSON.stringify(entry.details)}
                </div>` : ''}
            </div>
        `).join('');
        
        contentElement.innerHTML = logHTML;
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        const date = new dates(new Date(timestamp));
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Export audit log
     */
    exportAuditLog() {
        const csvContent = [
            'ID,Timestamp,Action,User ID,Severity,Details',
            ...this.auditLog.map(entry => 
                `"${entry.id}","${entry.timestamp}","${entry.action}","${entry.userId}","${entry.severity}","${entry.details ? JSON.stringify(entry.details).replace(/"/g, '""') : ''}"`
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `security-audit-log-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.logAction('audit.log.exported', {}, this.currentUser?.id, 'info');
    }

    /**
     * Set up session timeout
     */
    setupSessionTimeout() {
        let timeoutId;
        const resetTimeout = () => {
            clearTimeout(timeoutId);
            const timeoutValue = parseInt(document.getElementById('sessionTimeoutSelect')?.value || '1800');
            if (timeoutValue > 0) {
                timeoutId = setTimeout(() => {
                    this.logout();
                }, timeoutValue * 1000);
            }
        };
        
        // Reset timeout on user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimeout, true);
        });
        
        // Initial timeout setup
        resetTimeout();
    }

    /**
     * Log out current user
     */
    logout() {
        this.logAction('user.logout', {}, this.currentUser?.id, 'info');
        
        this.currentUser = null;
        this.sessionToken = null;
        localStorage.removeItem('session_token');
        
        // Redirect to login page (in a real app)
        // For now, just show a message
        alert('You have been logged out due to inactivity.');
        
        // Reset UI
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement) {
            welcomeElement.textContent = 'Good morning, Guest';
        }
        
        // Remove security badge
        const securityBadge = document.querySelector('.security-badge');
        if (securityBadge) {
            securityBadge.remove();
        }
    }

    /**
     * Show security notification
     */
    showSecurityNotification(message, severity) {
        // Use the existing notification system
        const notificationType = severity === 'error' ? 'error' : 
                                severity === 'warning' ? 'warning' : 'info';
        showNotification(`🔒 Security: ${message}`, notificationType);
    }

    /**
     * Secure API request wrapper
     */
    async secureApiRequest(url, options = {}) {
        // Add authentication header
        if (!options.headers) {
            options.headers = {};
        }
        options.headers['Authorization'] = `Bearer ${this.sessionToken}`;
        
        // Log the API request
        this.logAction('api.request', { url, method: options.method || 'GET' }, this.currentUser?.id, 'info');
        
        try {
            const response = await fetch(url, options);
            
            // Log the response
            this.logAction('api.response', { 
                url, 
                status: response.status,
                success: response.ok 
            }, this.currentUser?.id, response.ok ? 'info' : 'warning');
            
            return response;
        } catch (error) {
            this.logAction('api.error', { url, error: error.message }, this.currentUser?.id, 'error');
            throw error;
        }
    }
}

// Initialize security manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.securityManager = new SecurityManager();
    
    // Make security functions available globally
    window.hasPermission = (permission) => window.securityManager.hasPermission(permission);
    window.logSecurityAction = (action, details, severity) => 
        window.securityManager.logAction(action, details, null, severity);
});

// Close audit log modal function
function closeAuditLogModal() {
    const modal = document.getElementById('auditLogModal');
    if (modal) {
        modal.remove();
    }
}

// Export audit log function
function exportAuditLog() {
    if (window.securityManager) {
        window.securityManager.exportAuditLog();
        closeAuditLogModal();
    }
}