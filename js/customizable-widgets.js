/**
 * Customizable Dashboard Widgets Module
 * Implements widget customization, drag-and-drop placement, and user-defined configurations
 * Part of Mission Control Iteration 6
 */

class CustomizableWidgets {
    constructor() {
        this.widgets = new Map();
        this.widgetConfigs = new Map();
        this.availableWidgets = [];
        this.init();
    }

    init() {
        // Initialize available widgets
        this.initializeAvailableWidgets();
        
        // Load saved widget configurations from localStorage
        this.loadWidgetConfigurations();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize the widget customization panel
        this.initializeWidgetPanel();
        
        // Render widgets based on saved configuration
        this.renderWidgets();
    }

    /**
     * Initialize the list of available widgets
     */
    initializeAvailableWidgets() {
        this.availableWidgets = [
            {
                id: 'pcs-metric',
                name: 'PCS Progress',
                description: 'Track progress toward your 42-project goal',
                category: 'metrics',
                defaultConfig: {
                    visible: true,
                    position: { row: 0, col: 0 },
                    size: 'medium',
                    refreshInterval: 10000
                }
            },
            {
                id: 'active-projects',
                name: 'Active Projects',
                description: 'Monitor currently active projects',
                category: 'metrics',
                defaultConfig: {
                    visible: true,
                    position: { row: 0, col: 1 },
                    size: 'medium',
                    refreshInterval: 10000
                }
            },
            {
                id: 'tasks-today',
                name: 'Tasks Today',
                description: 'View tasks scheduled for today',
                category: 'metrics',
                defaultConfig: {
                    visible: true,
                    position: { row: 0, col: 2 },
                    size: 'medium',
                    refreshInterval: 10000
                }
            },
            {
                id: 'days-to-goal',
                name: 'Days to Goal',
                description: 'Countdown to your January 1st, 2027 deadline',
                category: 'metrics',
                defaultConfig: {
                    visible: true,
                    position: { row: 0, col: 3 },
                    size: 'medium',
                    refreshInterval: 60000
                }
            },
            {
                id: 'pcs-progress-chart',
                name: 'PCS Progress Chart',
                description: 'Visual chart of your project completion progress',
                category: 'charts',
                defaultConfig: {
                    visible: true,
                    position: { row: 1, col: 0 },
                    size: 'large',
                    chartType: 'line',
                    timeRange: 30
                }
            },
            {
                id: 'project-activity-chart',
                name: 'Project Activity Chart',
                description: 'Track your project activity over time',
                category: 'charts',
                defaultConfig: {
                    visible: true,
                    position: { row: 1, col: 1 },
                    size: 'large',
                    chartType: 'line',
                    timeRange: 30
                }
            },
            {
                id: 'agent-performance-chart',
                name: 'Agent Performance Chart',
                description: 'Monitor your OpenClaw agents\' performance',
                category: 'charts',
                defaultConfig: {
                    visible: true,
                    position: { row: 2, col: 0 },
                    size: 'large',
                    chartType: 'line',
                    timeRange: 30
                }
            },
            {
                id: 'productivity-trend-chart',
                name: 'Productivity Trend Chart',
                description: 'Analyze your productivity trends',
                category: 'charts',
                defaultConfig: {
                    visible: true,
                    position: { row: 2, col: 1 },
                    size: 'large',
                    chartType: 'line',
                    timeRange: 30
                }
            },
            {
                id: 'recent-activity',
                name: 'Recent Activity',
                description: 'View recent system and project activity',
                category: 'activity',
                defaultConfig: {
                    visible: true,
                    position: { row: 3, col: 0 },
                    size: 'large',
                    maxItems: 10
                }
            },
            {
                id: 'top-priorities',
                name: 'Top Priorities',
                description: 'Manage your current priorities',
                category: 'priorities',
                defaultConfig: {
                    visible: true,
                    position: { row: 3, col: 1 },
                    size: 'medium',
                    maxItems: 5
                }
            },
            {
                id: 'agent-status',
                name: 'Agent Status',
                description: 'Real-time status of all your agents',
                category: 'agents',
                defaultConfig: {
                    visible: true,
                    position: { row: 4, col: 0 },
                    size: 'large',
                    showHealth: true,
                    showCapabilities: true
                }
            },
            {
                id: 'collaboration-panel',
                name: 'Collaboration Panel',
                description: 'Real-time collaboration with team members',
                category: 'collaboration',
                defaultConfig: {
                    visible: false, // Hidden by default
                    position: { row: 4, col: 1 },
                    size: 'large',
                    showPresence: true,
                    enableChat: true
                }
            }
        ];

        // Register all available widgets
        this.availableWidgets.forEach(widget => {
            this.widgets.set(widget.id, widget);
        });
    }

    /**
     * Load widget configurations from localStorage
     */
    loadWidgetConfigurations() {
        try {
            const savedConfig = localStorage.getItem('missionControlWidgetConfig');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                this.widgetConfigs = new Map(Object.entries(parsedConfig));
                
                // Ensure all available widgets have configurations
                this.availableWidgets.forEach(widget => {
                    if (!this.widgetConfigs.has(widget.id)) {
                        this.widgetConfigs.set(widget.id, { ...widget.defaultConfig });
                    }
                });
            } else {
                // Initialize with default configurations
                this.availableWidgets.forEach(widget => {
                    this.widgetConfigs.set(widget.id, { ...widget.defaultConfig });
                });
            }
        } catch (error) {
            console.error('Error loading widget configurations:', error);
            // Initialize with defaults on error
            this.availableWidgets.forEach(widget => {
                this.widgetConfigs.set(widget.id, { ...widget.defaultConfig });
            });
        }
    }

    /**
     * Save widget configurations to localStorage
     */
    saveWidgetConfigurations() {
        try {
            const configObject = Object.fromEntries(this.widgetConfigs);
            localStorage.setItem('missionControlWidgetConfig', JSON.stringify(configObject));
            return true;
        } catch (error) {
            console.error('Error saving widget configurations:', error);
            return false;
        }
    }

    /**
     * Set up event listeners for widget interactions
     */
    setupEventListeners() {
        // Widget customization panel events
        document.addEventListener('click', (e) => {
            // Handle widget visibility toggle
            if (e.target.matches('.widget-visibility-toggle')) {
                const widgetId = e.target.dataset.widgetId;
                this.toggleWidgetVisibility(widgetId);
            }
            
            // Handle widget configuration click
            if (e.target.matches('.widget-config-btn')) {
                const widgetId = e.target.dataset.widgetId;
                this.openWidgetConfiguration(widgetId);
            }
            
            // Handle widget reset
            if (e.target.matches('.widget-reset-btn')) {
                const widgetId = e.target.dataset.widgetId;
                this.resetWidgetConfiguration(widgetId);
            }
        });

        // Handle form submissions in widget configuration modal
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.widget-config-form')) {
                e.preventDefault();
                this.saveWidgetConfigurationFromForm(e.target);
            }
        });

        // Handle close button clicks in modals
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close') || e.target.matches('.modal-overlay')) {
                this.closeAllModals();
            }
        });
    }

    /**
     * Initialize the widget customization panel
     */
    initializeWidgetPanel() {
        const customizationPanel = document.getElementById('customizationPanel');
        if (!customizationPanel) return;

        // Create widget customization section
        const widgetSection = document.createElement('div');
        widgetSection.className = 'customization-section';
        widgetSection.innerHTML = `
            <h3>Dashboard Widgets</h3>
            <p>Customize which widgets appear on your dashboard and how they behave.</p>
            <div class="widget-list" id="widgetList">
                <!-- Widget items will be populated here -->
            </div>
            <button class="add-priority-btn" id="addWidgetBtn" style="width: 100%; margin-top: 1rem;">
                + Add Widget
            </button>
        `;

        // Find the export settings section and insert before it
        const exportSection = customizationPanel.querySelector('[data-section="export"]');
        if (exportSection) {
            customizationPanel.insertBefore(widgetSection, exportSection);
        } else {
            // If export section not found, append to end
            customizationPanel.appendChild(widgetSection);
        }

        // Add event listener for add widget button
        const addWidgetBtn = document.getElementById('addWidgetBtn');
        if (addWidgetBtn) {
            addWidgetBtn.addEventListener('click', () => this.openAddWidgetModal());
        }

        // Populate the widget list
        this.populateWidgetList();
    }

    /**
     * Populate the widget list in the customization panel
     */
    populateWidgetList() {
        const widgetList = document.getElementById('widgetList');
        if (!widgetList) return;

        let widgetHTML = '';

        // Group widgets by category
        const widgetsByCategory = {};
        this.availableWidgets.forEach(widget => {
            if (!widgetsByCategory[widget.category]) {
                widgetsByCategory[widget.category] = [];
            }
            widgetsByCategory[widget.category].push(widget);
        });

        // Create HTML for each category
        Object.entries(widgetsByCategory).forEach(([category, widgets]) => {
            widgetHTML += `<h4 style="margin: 1rem 0 0.5rem 0; color: var(--text-secondary);">${category.charAt(0).toUpperCase() + category.slice(1)} Widgets</h4>`;
            
            widgets.forEach(widget => {
                const config = this.widgetConfigs.get(widget.id) || widget.defaultConfig;
                widgetHTML += `
                    <div class="widget-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <strong>${widget.name}</strong>
                            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.25rem 0;">${widget.description}</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <label class="toggle-switch">
                                <input type="checkbox" class="widget-visibility-toggle" data-widget-id="${widget.id}" ${config.visible ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                            <button class="widget-config-btn" data-widget-id="${widget.id}" style="padding: 0.25rem 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); cursor: pointer;">
                                ⚙️
                            </button>
                            <button class="widget-reset-btn" data-widget-id="${widget.id}" style="padding: 0.25rem 0.5rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); cursor: pointer;">
                                🔄
                            </button>
                        </div>
                    </div>
                `;
            });
        });

        widgetList.innerHTML = widgetHTML;
    }

    /**
     * Toggle widget visibility
     */
    toggleWidgetVisibility(widgetId) {
        const config = this.widgetConfigs.get(widgetId);
        if (config) {
            config.visible = !config.visible;
            this.widgetConfigs.set(widgetId, config);
            this.saveWidgetConfigurations();
            this.renderWidgets();
            
            // Update the toggle in the UI
            const toggle = document.querySelector(`.widget-visibility-toggle[data-widget-id="${widgetId}"]`);
            if (toggle) {
                toggle.checked = config.visible;
            }
        }
    }

    /**
     * Open widget configuration modal
     */
    openWidgetConfiguration(widgetId) {
        const widget = this.widgets.get(widgetId);
        const config = this.widgetConfigs.get(widgetId);
        
        if (!widget || !config) return;

        // Create modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="widgetConfigModal" style="display:block;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:2000;">
                <div class="modal-content" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);max-width:600px;width:90%;max-height:80vh;overflow-y:auto;margin:5% auto;padding:var(--spacing-xl);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-md);">
                        <h3 style="margin:0;">Configure: ${widget.name}</h3>
                        <button class="modal-close" style="background:none;border:none;color:var(--text-primary);font-size:1.5rem;cursor:pointer;">×</button>
                    </div>
                    
                    <form class="widget-config-form" data-widget-id="${widgetId}">
                        <div style="margin-bottom:var(--spacing-md);">
                            <label style="display:block;margin-bottom:var(--spacing-xs);">Visibility</label>
                            <label class="toggle-switch">
                                <input type="checkbox" name="visible" ${config.visible ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        ${this.generateWidgetConfigFields(widget, config)}
                        
                        <div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-lg);">
                            <button type="button" class="modal-close" style="padding:var(--spacing-sm) var(--spacing-md);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);cursor:pointer;">Cancel</button>
                            <button type="submit" style="padding:var(--spacing-sm) var(--spacing-md);background:var(--accent-primary);border:none;border-radius:var(--radius-md);color:var(--bg-primary);cursor:pointer;">Save Configuration</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    /**
     * Generate configuration fields based on widget type
     */
    generateWidgetConfigFields(widget, config) {
        let fieldsHTML = '';

        // Common fields
        fieldsHTML += `
            <div style="margin-bottom:var(--spacing-md);">
                <label style="display:block;margin-bottom:var(--spacing-xs);">Size</label>
                <select name="size" style="width:100%;padding:var(--spacing-sm);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);">
                    <option value="small" ${config.size === 'small' ? 'selected' : ''}>Small</option>
                    <option value="medium" ${config.size === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="large" ${config.size === 'large' ? 'selected' : ''}>Large</option>
                </select>
            </div>
        `;

        // Widget-specific fields
        switch (widget.id) {
            case 'pcs-metric':
            case 'active-projects':
            case 'tasks-today':
            case 'days-to-goal':
                fieldsHTML += `
                    <div style="margin-bottom:var(--spacing-md);">
                        <label style="display:block;margin-bottom:var(--spacing-xs);">Refresh Interval (ms)</label>
                        <input type="number" name="refreshInterval" value="${config.refreshInterval || 10000}" min="1000" step="1000" style="width:100%;padding:var(--spacing-sm);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);">
                    </div>
                `;
                break;
                
            case 'pcs-progress-chart':
            case 'project-activity-chart':
            case 'agent-performance-chart':
            case 'productivity-trend-chart':
                fieldsHTML += `
                    <div style="margin-bottom:var(--spacing-md);">
                        <label style="display:block;margin-bottom:var(--spacing-xs);">Chart Type</label>
                        <select name="chartType" style="width:100%;padding:var(--spacing-sm);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);">
                            <option value="line" ${config.chartType === 'line' ? 'selected' : ''}>Line</option>
                            <option value="bar" ${config.chartType === 'bar' ? 'selected' : ''}>Bar</option>
                            <option value="area" ${config.chartType === 'area' ? 'selected' : ''}>Area</option>
                        </select>
                    </div>
                    <div style="margin-bottom:var(--spacing-md);">
                        <label style="display:block;margin-bottom:var(--spacing-xs);">Time Range (days)</label>
                        <select name="timeRange" style="width:100%;padding:var(--spacing-sm);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);">
                            <option value="7" ${config.timeRange === 7 ? 'selected' : ''}>Last 7 days</option>
                            <option value="30" ${config.timeRange === 30 ? 'selected' : ''}>Last 30 days</option>
                            <option value="90" ${config.timeRange === 90 ? 'selected' : ''}>Last 90 days</option>
                            <option value="365" ${config.timeRange === 365 ? 'selected' : ''}>Last year</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'recent-activity':
            case 'top-priorities':
                fieldsHTML += `
                    <div style="margin-bottom:var(--spacing-md);">
                        <label style="display:block;margin-bottom:var(--spacing-xs);">Maximum Items</label>
                        <input type="number" name="maxItems" value="${config.maxItems || 10}" min="1" max="50" style="width:100%;padding:var(--spacing-sm);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);">
                    </div>
                `;
                break;
                
            case 'agent-status':
                fieldsHTML += `
                    <div style="margin-bottom:var(--spacing-md);">
                        <label style="display:block;margin-bottom:var(--spacing-xs);">
                            <input type="checkbox" name="showHealth" ${config.showHealth ? 'checked' : ''} style="margin-right:var(--spacing-sm);">
                            Show Health Metrics
                        </label>
                    </div>
                    <div style="margin-bottom:var(--spacing-md);">
                        <label style="display:block;margin-bottom:var(--spacing-xs);">
                            <input type="checkbox" name="showCapabilities" ${config.showCapabilities ? 'checked' : ''} style="margin-right:var(--spacing-sm);">
                            Show Capabilities
                        </label>
                    </div>
                `;
                break;
                
            case 'collaboration-panel':
                fieldsHTML += `
                    <div style="margin-bottom:var(--spacing-md);">
                        <label style="display:block;margin-bottom:var(--spacing-xs);">
                            <input type="checkbox" name="showPresence" ${config.showPresence ? 'checked' : ''} style="margin-right:var(--spacing-sm);">
                            Show Team Presence
                        </label>
                    </div>
                    <div style="margin-bottom:var(--spacing-md);">
                        <label style="display:block;margin-bottom:var(--spacing-xs);">
                            <input type="checkbox" name="enableChat" ${config.enableChat ? 'checked' : ''} style="margin-right:var(--spacing-sm);">
                            Enable Chat
                        </label>
                    </div>
                `;
                break;
        }

        return fieldsHTML;
    }

    /**
     * Save widget configuration from form
     */
    saveWidgetConfigurationFromForm(form) {
        const widgetId = form.dataset.widgetId;
        const config = this.widgetConfigs.get(widgetId);
        
        if (!config) return;

        // Update configuration from form values
        const formData = new FormData(form);
        const formValues = Object.fromEntries(formData.entries());

        // Handle checkbox values
        config.visible = formValues.visible === 'on';
        
        // Handle other values based on widget type
        switch (widgetId) {
            case 'pcs-metric':
            case 'active-projects':
            case 'tasks-today':
            case 'days-to-goal':
                config.size = formValues.size;
                config.refreshInterval = parseInt(formValues.refreshInterval) || 10000;
                break;
                
            case 'pcs-progress-chart':
            case 'project-activity-chart':
            case 'agent-performance-chart':
            case 'productivity-trend-chart':
                config.size = formValues.size;
                config.chartType = formValues.chartType;
                config.timeRange = parseInt(formValues.timeRange) || 30;
                break;
                
            case 'recent-activity':
            case 'top-priorities':
                config.size = formValues.size;
                config.maxItems = parseInt(formValues.maxItems) || 10;
                break;
                
            case 'agent-status':
                config.size = formValues.size;
                config.showHealth = formValues.showHealth === 'on';
                config.showCapabilities = formValues.showCapabilities === 'on';
                break;
                
            case 'collaboration-panel':
                config.size = formValues.size;
                config.showPresence = formValues.showPresence === 'on';
                config.enableChat = formValues.enableChat === 'on';
                break;
                
            default:
                config.size = formValues.size;
        }

        this.widgetConfigs.set(widgetId, config);
        this.saveWidgetConfigurations();
        this.renderWidgets();
        this.closeAllModals();
        
        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification(`Widget "${this.widgets.get(widgetId).name}" configured successfully!`, 'success');
        }
    }

    /**
     * Reset widget configuration to defaults
     */
    resetWidgetConfiguration(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
            this.widgetConfigs.set(widgetId, { ...widget.defaultConfig });
            this.saveWidgetConfigurations();
            this.populateWidgetList();
            this.renderWidgets();
            
            if (typeof showNotification === 'function') {
                showNotification(`Widget "${widget.name}" reset to defaults!`, 'info');
            }
        }
    }

    /**
     * Open add widget modal
     */
    openAddWidgetModal() {
        // Get hidden widgets
        const hiddenWidgets = this.availableWidgets.filter(widget => {
            const config = this.widgetConfigs.get(widget.id);
            return !config || !config.visible;
        });

        if (hiddenWidgets.length === 0) {
            if (typeof showNotification === 'function') {
                showNotification('All widgets are already visible!', 'info');
            }
            return;
        }

        let widgetOptionsHTML = '';
        hiddenWidgets.forEach(widget => {
            widgetOptionsHTML += `
                <div style="display:flex;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border-color);">
                    <input type="checkbox" id="addWidget_${widget.id}" name="widgets" value="${widget.id}" style="margin-right:0.5rem;">
                    <label for="addWidget_${widget.id}">
                        <strong>${widget.name}</strong>
                        <p style="font-size:0.85rem;color:var(--text-secondary);margin:0.25rem 0;">${widget.description}</p>
                    </label>
                </div>
            `;
        });

        const modalHTML = `
            <div class="modal-overlay" id="addWidgetModal" style="display:block;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:2000;">
                <div class="modal-content" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);max-width:600px;width:90%;max-height:80vh;overflow-y:auto;margin:5% auto;padding:var(--spacing-xl);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-md);">
                        <h3 style="margin:0;">Add Widgets</h3>
                        <button class="modal-close" style="background:none;border:none;color:var(--text-primary);font-size:1.5rem;cursor:pointer;">×</button>
                    </div>
                    
                    <p>Select widgets to make visible on your dashboard:</p>
                    <div style="max-height:400px;overflow-y:auto;margin:1rem 0;">
                        ${widgetOptionsHTML}
                    </div>
                    
                    <div style="display:flex;gap:var(--spacing-md);justify-content:flex-end;margin-top:var(--spacing-lg);">
                        <button type="button" class="modal-close" style="padding:var(--spacing-sm) var(--spacing-md);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);color:var(--text-primary);cursor:pointer;">Cancel</button>
                        <button type="button" id="confirmAddWidgets" style="padding:var(--spacing-sm) var(--spacing-md);background:var(--accent-primary);border:none;border-radius:var(--radius-md);color:var(--bg-primary);cursor:pointer;">Add Selected Widgets</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listener for confirm button
        document.getElementById('confirmAddWidgets').addEventListener('click', () => {
            const selectedWidgets = document.querySelectorAll('#addWidgetModal input[name="widgets"]:checked');
            selectedWidgets.forEach(checkbox => {
                const widgetId = checkbox.value;
                const config = this.widgetConfigs.get(widgetId);
                if (config) {
                    config.visible = true;
                    this.widgetConfigs.set(widgetId, config);
                }
            });
            
            this.saveWidgetConfigurations();
            this.populateWidgetList();
            this.renderWidgets();
            this.closeAllModals();
            
            if (selectedWidgets.length > 0 && typeof showNotification === 'function') {
                showNotification(`${selectedWidgets.length} widget(s) added to dashboard!`, 'success');
            }
        });
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }

    /**
     * Render widgets based on current configuration
     */
    renderWidgets() {
        // Render metrics grid
        this.renderMetricsGrid();
        
        // Render charts section
        this.renderChartsSection();
        
        // Render activity feed
        this.renderActivityFeed();
        
        // Render priorities section
        this.renderPrioritiesSection();
        
        // Render agents grid (if needed)
        this.renderAgentsGrid();
        
        // Render collaboration panel (if enabled)
        this.renderCollaborationPanel();
    }

    /**
     * Render metrics grid based on widget configurations
     */
    renderMetricsGrid() {
        const metricsGrid = document.getElementById('metricsGrid');
        if (!metricsGrid) return;

        let metricsHTML = '';
        const metricWidgets = ['pcs-metric', 'active-projects', 'tasks-today', 'days-to-goal'];
        
        metricWidgets.forEach(widgetId => {
            const config = this.widgetConfigs.get(widgetId);
            const widget = this.widgets.get(widgetId);
            
            if (config && config.visible && window.state && window.state.metrics) {
                const metrics = window.state.metrics;
                
                switch (widgetId) {
                    case 'pcs-metric':
                        metricsHTML += `
                            <div class="metric-card" data-widget-id="${widgetId}">
                                <div class="metric-accent"></div>
                                <div class="metric-header">
                                    <span class="metric-icon">🎯</span>
                                    <span class="metric-label">PCS Progress</span>
                                </div>
                                <div class="metric-value">${metrics.pcsProgress}/42</div>
                                <div class="metric-trend">
                                    <span>▲ 0 this week</span>
                                </div>
                                <button class="complete-project-btn" onclick="showCompleteProjectModal()">✅ Complete Project</button>
                            </div>
                        `;
                        break;
                        
                    case 'active-projects':
                        metricsHTML += `
                            <div class="metric-card" data-widget-id="${widgetId}">
                                <div class="metric-accent"></div>
                                <div class="metric-header">
                                    <span class="metric-icon">🏗️</span>
                                    <span class="metric-label">Active Projects</span>
                                </div>
                                <div class="metric-value">${metrics.activeProjects}</div>
                                <div class="metric-trend">
                                    <span>Steady</span>
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 'tasks-today':
                        metricsHTML += `
                            <div class="metric-card" data-widget-id="${widgetId}">
                                <div class="metric-accent"></div>
                                <div class="metric-header">
                                    <span class="metric-icon">✅</span>
                                    <span class="metric-label">Tasks Today</span>
                                </div>
                                <div class="metric-value">${metrics.tasksToday}</div>
                                <div class="metric-trend">
                                    <span>▲ 0 vs yesterday</span>
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 'days-to-goal':
                        metricsHTML += `
                            <div class="metric-card" data-widget-id="${widgetId}">
                                <div class="metric-accent"></div>
                                <div class="metric-header">
                                    <span class="metric-icon">⏰</span>
                                    <span class="metric-label">Days to Goal</span>
                                </div>
                                <div class="metric-value">${metrics.daysToGoal}</div>
                                <div class="metric-trend ${metrics.daysToGoal < 300 ? 'negative' : ''}">
                                    <span>${metrics.daysToGoal < 300 ? '⚠️ Critical' : 'On track'}</span>
                                </div>
                            </div>
                        `;
                        break;
                }
            }
        });

        if (metricsHTML === '') {
            metricsGrid.innerHTML = '<div class="text-center text-muted">No metrics widgets configured for display</div>';
        } else {
            metricsGrid.innerHTML = metricsHTML;
        }
    }

    /**
     * Render charts section based on widget configurations
     */
    renderChartsSection() {
        const chartsSection = document.querySelector('.charts-section');
        if (!chartsSection) return;

        const chartWidgets = ['pcs-progress-chart', 'project-activity-chart', 'agent-performance-chart', 'productivity-trend-chart'];
        let anyChartVisible = false;
        
        chartWidgets.forEach(widgetId => {
            const config = this.widgetConfigs.get(widgetId);
            if (config && config.visible) {
                anyChartVisible = true;
            }
        });

        if (!anyChartVisible) {
            // Hide the entire charts section if no charts are visible
            chartsSection.style.display = 'none';
            return;
        }

        chartsSection.style.display = 'block';
        
        // The actual chart rendering is handled by the existing chart initialization code
        // We just need to ensure the charts section is visible when needed
    }

    /**
     * Render activity feed based on widget configuration
     */
    renderActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;

        const config = this.widgetConfigs.get('recent-activity');
        if (!config || !config.visible) {
            activityFeed.style.display = 'none';
            return;
        }

        activityFeed.style.display = 'block';
        // The actual activity feed content is rendered by the existing renderActivityFeed function
    }

    /**
     * Render priorities section based on widget configuration
     */
    renderPrioritiesSection() {
        const prioritiesSection = document.querySelector('.priorities-section');
        if (!prioritiesSection) return;

        const config = this.widgetConfigs.get('top-priorities');
        if (!config || !config.visible) {
            prioritiesSection.style.display = 'none';
            return;
        }

        prioritiesSection.style.display = 'block';
        // The actual priorities content is rendered by the existing renderPriorities function
    }

    /**
     * Render agents grid based on widget configuration
     */
    renderAgentsGrid() {
        const agentsGrid = document.getElementById('agentsGrid');
        if (!agentsGrid) return;

        const config = this.widgetConfigs.get('agent-status');
        if (!config || !config.visible) {
            agentsGrid.style.display = 'none';
            return;
        }

        agentsGrid.style.display = 'block';
        // The actual agents content is rendered by the existing renderAgents function
    }

    /**
     * Render collaboration panel based on widget configuration
     */
    renderCollaborationPanel() {
        // This will be implemented as part of the real-time collaboration features
        // For now, we'll just ensure the element exists if needed
        const config = this.widgetConfigs.get('collaboration-panel');
        if (config && config.visible) {
            // Ensure collaboration panel exists in DOM
            let collaborationPanel = document.getElementById('collaborationPanel');
            if (!collaborationPanel) {
                collaborationPanel = document.createElement('div');
                collaborationPanel.id = 'collaborationPanel';
                collaborationPanel.className = 'collaboration-panel';
                collaborationPanel.style.cssText = `
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-lg);
                    padding: var(--spacing-lg);
                    margin-bottom: var(--spacing-xl);
                `;
                
                // Insert after priorities section or at end of dashboard
                const prioritiesSection = document.querySelector('.priorities-section');
                if (prioritiesSection) {
                    prioritiesSection.parentNode.insertBefore(collaborationPanel, prioritiesSection.nextSibling);
                } else {
                    const dashboardTab = document.getElementById('dashboardTab');
                    if (dashboardTab) {
                        dashboardTab.appendChild(collaborationPanel);
                    }
                }
            }
            
            // Initialize collaboration panel content
            this.initializeCollaborationPanel(collaborationPanel, config);
        } else {
            // Remove collaboration panel if it exists
            const collaborationPanel = document.getElementById('collaborationPanel');
            if (collaborationPanel) {
                collaborationPanel.remove();
            }
        }
    }

    /**
     * Initialize collaboration panel content
     */
    initializeCollaborationPanel(panelElement, config) {
        let panelHTML = `
            <h2 class="collaboration-title" style="font-size: 1.25rem; font-weight: 600; margin-bottom: var(--spacing-md);">
                Team Collaboration
            </h2>
        `;

        if (config.showPresence) {
            panelHTML += `
                <div class="team-presence" id="teamPresence" style="margin-bottom: var(--spacing-md);">
                    <h3 style="font-size: 1rem; margin-bottom: var(--spacing-sm);">Team Members Online</h3>
                    <div id="presenceList" style="display: flex; flex-wrap: wrap; gap: var(--spacing-sm);"></div>
                </div>
            `;
        }

        if (config.enableChat) {
            panelHTML += `
                <div class="team-chat" id="teamChat">
                    <h3 style="font-size: 1rem; margin-bottom: var(--spacing-sm);">Team Chat</h3>
                    <div id="chatMessages" style="height: 200px; overflow-y: auto; background: var(--bg-secondary); border-radius: var(--radius-md); padding: var(--spacing-sm); margin-bottom: var(--spacing-sm);"></div>
                    <div style="display: flex; gap: var(--spacing-sm);">
                        <input type="text" id="chatInput" placeholder="Type a message..." style="flex: 1; padding: var(--spacing-sm); background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-primary);">
                        <button id="sendChatBtn" style="padding: var(--spacing-sm) var(--spacing-md); background: var(--accent-primary); border: none; border-radius: var(--radius-md); color: var(--bg-primary); cursor: pointer;">Send</button>
                    </div>
                </div>
            `;
        }

        panelElement.innerHTML = panelHTML;

        // Set up chat functionality if enabled
        if (config.enableChat) {
            const chatInput = document.getElementById('chatInput');
            const sendChatBtn = document.getElementById('sendChatBtn');
            const chatMessages = document.getElementById('chatMessages');

            if (chatInput && sendChatBtn) {
                sendChatBtn.addEventListener('click', () => this.sendChatMessage());
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendChatMessage();
                    }
                });
            }
        }
    }

    /**
     * Send a chat message
     */
    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        
        if (!chatInput || !chatMessages) return;

        const message = chatInput.value.trim();
        if (!message) return;

        // In a real implementation, this would send the message to the collaboration service
        const messageHTML = `
            <div style="margin-bottom: var(--spacing-xs);">
                <strong>You</strong>: ${message}
                <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: var(--spacing-xs);">
                    ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        `;

        chatMessages.innerHTML += messageHTML;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = '';

        // Simulate response from team member (for demo purposes)
        setTimeout(() => {
            const responses = [
                "Got it!",
                "Thanks for the update!",
                "I'll look into that.",
                "Great point!",
                "Let me know if you need help with that."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            const responseHTML = `
                <div style="margin-bottom: var(--spacing-xs);">
                    <strong>Team Member</strong>: ${randomResponse}
                    <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: var(--spacing-xs);">
                        ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            `;
            
            chatMessages.innerHTML += responseHTML;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 2000);
    }

    /**
     * Refresh widget data based on configurations
     */
    refreshWidgets() {
        // Refresh metrics widgets
        const metricWidgets = ['pcs-metric', 'active-projects', 'tasks-today', 'days-to-goal'];
        metricWidgets.forEach(widgetId => {
            const config = this.widgetConfigs.get(widgetId);
            if (config && config.visible) {
                // Trigger refresh based on refreshInterval
                // This would be handled by the main data polling mechanism
            }
        });

        // Refresh chart widgets
        const chartWidgets = ['pcs-progress-chart', 'project-activity-chart', 'agent-performance-chart', 'productivity-trend-chart'];
        chartWidgets.forEach(widgetId => {
            const config = this.widgetConfigs.get(widgetId);
            if (config && config.visible) {
                // Update charts with new data
                if (window.updateCharts && typeof window.updateCharts === 'function') {
                    window.updateCharts();
                }
            }
        });
    }

    /**
     * Export widget configurations
     */
    exportWidgetConfigurations() {
        const configObject = Object.fromEntries(this.widgetConfigs);
        const blob = new Blob([JSON.stringify(configObject, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mission-control-widget-config.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Import widget configurations
     */
    importWidgetConfigurations(configData) {
        try {
            const importedConfig = typeof configData === 'string' ? JSON.parse(configData) : configData;
            
            // Validate and merge with available widgets
            Object.entries(importedConfig).forEach(([widgetId, config]) => {
                const widget = this.widgets.get(widgetId);
                if (widget) {
                    // Merge with default config to ensure all required properties exist
                    const mergedConfig = { ...widget.defaultConfig, ...config };
                    this.widgetConfigs.set(widgetId, mergedConfig);
                }
            });
            
            this.saveWidgetConfigurations();
            this.populateWidgetList();
            this.renderWidgets();
            
            if (typeof showNotification === 'function') {
                showNotification('Widget configurations imported successfully!', 'success');
            }
            
            return true;
        } catch (error) {
            console.error('Error importing widget configurations:', error);
            if (typeof showNotification === 'function') {
                showNotification('Error importing widget configurations', 'error');
            }
            return false;
        }
    }
}

// Initialize customizable widgets when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.customizableWidgets === 'undefined') {
        window.customizableWidgets = new CustomizableWidgets();
    }
});

// Make the class available globally
window.CustomizableWidgets = CustomizableWidgets;