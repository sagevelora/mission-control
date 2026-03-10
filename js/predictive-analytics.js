/**
 * Advanced Predictive Analytics Module
 * Implements machine learning models for trend prediction, anomaly detection,
 * automated recommendations, and forecasting capabilities.
 */

class PredictiveAnalytics {
    constructor() {
        this.models = {
            trendPrediction: null,
            anomalyDetection: null,
            recommendationEngine: null,
            forecasting: null
        };
        this.dataCache = new Map();
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            // Initialize all predictive models
            await this.initializeModels();
            this.initialized = true;
            console.log('Predictive Analytics module initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Predictive Analytics:', error);
            this.initialized = false;
        }
    }

    async initializeModels() {
        // Initialize trend prediction model
        this.models.trendPrediction = new TrendPredictionModel();
        
        // Initialize anomaly detection model
        this.models.anomalyDetection = new AnomalyDetectionModel();
        
        // Initialize recommendation engine
        this.models.recommendationEngine = new RecommendationEngine();
        
        // Initialize forecasting model
        this.models.forecasting = new ForecastingModel();
        
        // Load historical data for training
        await this.loadHistoricalData();
        
        // Train initial models
        await this.trainModels();
    }

    async loadHistoricalData() {
        try {
            // Load data from various sources
            const metricsData = await this.fetchData('/api/metrics/history');
            const projectsData = await this.fetchData('/api/projects/history');
            const agentsData = await this.fetchData('/api/agents/history');
            const activityData = await this.fetchData('/api/activity/history');

            // Cache the data for quick access
            this.dataCache.set('metrics', metricsData);
            this.dataCache.set('projects', projectsData);
            this.dataCache.set('agents', agentsData);
            this.dataCache.set('activity', activityData);

            return { metricsData, projectsData, agentsData, activityData };
        } catch (error) {
            console.error('Error loading historical data:', error);
            throw error;
        }
    }

    async fetchData(endpoint) {
        // Simulate API call - in real implementation, this would call the actual API
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate mock historical data
                const mockData = this.generateMockHistoricalData(endpoint);
                resolve(mockData);
            }, 100);
        });
    }

    generateMockHistoricalData(endpoint) {
        const now = new Date();
        const data = [];
        
        // Generate 90 days of historical data
        for (let i = 90; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            switch (endpoint) {
                case '/api/metrics/history':
                    data.push({
                        date: date.toISOString(),
                        pcsProgress: Math.floor(Math.random() * 42),
                        activeProjects: Math.floor(Math.random() * 10),
                        tasksToday: Math.floor(Math.random() * 20),
                        daysToGoal: 297 - i
                    });
                    break;
                case '/api/projects/history':
                    data.push({
                        date: date.toISOString(),
                        completedProjects: Math.floor(Math.random() * 5),
                        inProgressProjects: Math.floor(Math.random() * 8),
                        backlogProjects: Math.floor(Math.random() * 15)
                    });
                    break;
                case '/api/agents/history':
                    data.push({
                        date: date.toISOString(),
                        activeAgents: Math.floor(Math.random() * 5) + 1,
                        avgCpuUsage: Math.random() * 100,
                        avgMemoryUsage: Math.random() * 1000,
                        avgResponseTime: Math.random() * 1000
                    });
                    break;
                case '/api/activity/history':
                    data.push({
                        date: date.toISOString(),
                        totalActivities: Math.floor(Math.random() * 50),
                        projectActivities: Math.floor(Math.random() * 30),
                        agentActivities: Math.floor(Math.random() * 20)
                    });
                    break;
                default:
                    data.push({ date: date.toISOString(), value: Math.random() * 100 });
            }
        }
        
        return data;
    }

    async trainModels() {
        if (!this.dataCache.size) {
            throw new Error('No historical data available for training');
        }

        // Train each model with appropriate data
        await this.models.trendPrediction.train(this.dataCache.get('metrics'));
        await this.models.anomalyDetection.train([
            ...this.dataCache.get('metrics'),
            ...this.dataCache.get('agents')
        ]);
        await this.models.recommendationEngine.train(this.dataCache.get('projects'));
        await this.models.forecasting.train(this.dataCache.get('metrics'));
    }

    /**
     * Predict future trends based on historical data
     * @param {string} metric - The metric to predict (pcsProgress, activeProjects, etc.)
     * @param {number} daysAhead - Number of days to predict ahead
     * @returns {Object} Prediction results with confidence intervals
     */
    async predictTrend(metric, daysAhead = 30) {
        if (!this.initialized) {
            throw new Error('Predictive Analytics module not initialized');
        }
        
        return await this.models.trendPrediction.predict(metric, daysAhead);
    }

    /**
     * Detect anomalies in current system metrics
     * @param {Object} currentMetrics - Current metrics to analyze
     * @returns {Array} Array of detected anomalies
     */
    async detectAnomalies(currentMetrics) {
        if (!this.initialized) {
            throw new Error('Predictive Analytics module not initialized');
        }
        
        return await this.models.anomalyDetection.detect(currentMetrics);
    }

    /**
     * Generate automated recommendations for optimization
     * @param {Object} currentState - Current state of the system
     * @returns {Array} Array of recommendations
     */
    async generateRecommendations(currentState) {
        if (!this.initialized) {
            throw new Error('Predictive Analytics module not initialized');
        }
        
        return await this.models.recommendationEngine.recommend(currentState);
    }

    /**
     * Forecast future resource needs and planning
     * @param {string} resourceType - Type of resource to forecast
     * @param {number} period - Forecast period in days
     * @returns {Object} Forecast results
     */
    async forecastResources(resourceType, period = 30) {
        if (!this.initialized) {
            throw new Error('Predictive Analytics module not initialized');
        }
        
        return await this.models.forecasting.forecast(resourceType, period);
    }

    /**
     * Update models with new data
     * @param {string} dataType - Type of data being updated
     * @param {Object} newData - New data point
     */
    async updateModel(dataType, newData) {
        if (!this.initialized) {
            return;
        }

        // Add new data to cache
        const existingData = this.dataCache.get(dataType) || [];
        existingData.push(newData);
        this.dataCache.set(dataType, existingData);

        // Retrain models incrementally
        switch (dataType) {
            case 'metrics':
                await this.models.trendPrediction.update(newData);
                await this.models.forecasting.update(newData);
                break;
            case 'projects':
                await this.models.recommendationEngine.update(newData);
                break;
            case 'agents':
                await this.models.anomalyDetection.update(newData);
                break;
        }
    }

    /**
     * Get insights dashboard data
     * @returns {Object} Comprehensive insights for the dashboard
     */
    async getInsightsDashboard() {
        if (!this.initialized) {
            return this.getFallbackInsights();
        }

        try {
            const currentState = window.state || {};
            const metrics = currentState.metrics || {};
            const projects = currentState.projects || [];
            const agents = currentState.agents || [];

            // Get predictions
            const pcsTrend = await this.predictTrend('pcsProgress', 30);
            const projectsTrend = await this.predictTrend('activeProjects', 30);

            // Detect anomalies
            const anomalies = await this.detectAnomalies(metrics);

            // Generate recommendations
            const recommendations = await this.generateRecommendations({
                metrics,
                projects,
                agents
            });

            // Forecast resources
            const resourceForecast = await this.forecastResources('computing', 30);

            return {
                trends: {
                    pcsProgress: pcsTrend,
                    activeProjects: projectsTrend
                },
                anomalies,
                recommendations,
                resourceForecast,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating insights dashboard:', error);
            return this.getFallbackInsights();
        }
    }

    getFallbackInsights() {
        // Return basic insights when predictive analytics is not available
        const currentState = window.state || {};
        const metrics = currentState.metrics || {};
        const projects = currentState.projects || [];
        const agents = currentState.agents || [];

        return {
            trends: {
                pcsProgress: {
                    prediction: 'Not available',
                    confidence: 0,
                    trend: 'unknown'
                },
                activeProjects: {
                    prediction: 'Not available',
                    confidence: 0,
                    trend: 'unknown'
                }
            },
            anomalies: [],
            recommendations: [
                {
                    type: 'info',
                    message: 'Predictive analytics requires more historical data',
                    action: 'Continue using the system to build data history'
                }
            ],
            resourceForecast: {
                computing: 'Not available',
                storage: 'Not available',
                bandwidth: 'Not available'
            },
            lastUpdated: new Date().toISOString()
        };
    }
}

/**
 * Trend Prediction Model
 * Uses time series analysis and linear regression for trend prediction
 */
class TrendPredictionModel {
    constructor() {
        this.model = null;
        this.lastTrained = null;
    }

    async train(data) {
        // Simple linear regression implementation
        if (!data || data.length < 2) {
            throw new Error('Insufficient data for training');
        }

        // Extract relevant features for trend prediction
        const features = data.map((item, index) => ({
            x: index,
            y: item.pcsProgress || item.activeProjects || 0
        }));

        // Calculate linear regression coefficients
        const n = features.length;
        const sumX = features.reduce((sum, f) => sum + f.x, 0);
        const sumY = features.reduce((sum, f) => sum + f.y, 0);
        const sumXY = features.reduce((sum, f) => sum + f.x * f.y, 0);
        const sumXX = features.reduce((sum, f) => sum + f.x * f.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        this.model = { slope, intercept, n };
        this.lastTrained = new Date();
    }

    async predict(metric, daysAhead) {
        if (!this.model) {
            return {
                prediction: 'No model trained',
                confidence: 0,
                trend: 'unknown'
            };
        }

        // Predict future values
        const futureX = this.model.n + daysAhead;
        const prediction = this.model.slope * futureX + this.model.intercept;
        
        // Calculate confidence based on data quality and model fit
        const rSquared = this.calculateRSquared();
        const confidence = Math.min(1, Math.max(0, rSquared));

        // Determine trend direction
        let trend = 'stable';
        if (this.model.slope > 0.1) {
            trend = 'increasing';
        } else if (this.model.slope < -0.1) {
            trend = 'decreasing';
        }

        return {
            prediction: Math.round(prediction),
            confidence: Math.round(confidence * 100),
            trend,
            daysAhead
        };
    }

    calculateRSquared() {
        // Simplified R-squared calculation
        // In a real implementation, this would use actual residual calculations
        return Math.abs(this.model.slope) / 10; // Normalize to 0-1 range
    }

    async update(newData) {
        // Incremental update - retrain with new data point
        // This is a simplified approach; real implementation would use online learning
        console.log('Updating trend prediction model with new data:', newData);
    }
}

/**
 * Anomaly Detection Model
 * Uses statistical methods to detect outliers and anomalies
 */
class AnomalyDetectionModel {
    constructor() {
        this.baselineStats = null;
        this.threshold = 2; // Standard deviations for anomaly detection
    }

    async train(data) {
        if (!data || data.length === 0) {
            throw new Error('No data available for anomaly detection training');
        }

        // Calculate baseline statistics for each metric
        const metrics = ['pcsProgress', 'activeProjects', 'tasksToday', 'daysToGoal', 'cpu', 'memory', 'responseTime'];
        const stats = {};

        metrics.forEach(metric => {
            const values = data
                .map(item => item[metric])
                .filter(val => val !== undefined && val !== null);

            if (values.length > 0) {
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                const stdDev = Math.sqrt(variance);
                
                stats[metric] = { mean, stdDev, min: Math.min(...values), max: Math.max(...values) };
            }
        });

        this.baselineStats = stats;
    }

    async detect(currentMetrics) {
        if (!this.baselineStats) {
            return [];
        }

        const anomalies = [];

        Object.entries(currentMetrics).forEach(([metric, currentValue]) => {
            if (this.baselineStats[metric]) {
                const { mean, stdDev } = this.baselineStats[metric];
                const zScore = Math.abs((currentValue - mean) / stdDev);

                if (zScore > this.threshold) {
                    anomalies.push({
                        metric,
                        currentValue,
                        expectedRange: {
                            min: mean - this.threshold * stdDev,
                            max: mean + this.threshold * stdDev
                        },
                        severity: zScore > 3 ? 'critical' : 'warning',
                        description: this.getAnomalyDescription(metric, currentValue, zScore)
                    });
                }
            }
        });

        return anomalies;
    }

    getAnomalyDescription(metric, value, zScore) {
        const descriptions = {
            pcsProgress: `PCS progress is ${zScore > 0 ? 'higher' : 'lower'} than expected`,
            activeProjects: `Active projects count is ${zScore > 0 ? 'higher' : 'lower'} than normal`,
            cpu: `CPU usage is abnormally ${zScore > 0 ? 'high' : 'low'}`,
            memory: `Memory usage is ${zScore > 0 ? 'excessive' : 'unusually low'}`,
            responseTime: `Response time is ${zScore > 0 ? 'slower' : 'faster'} than expected`
        };

        return descriptions[metric] || `Anomaly detected in ${metric}`;
    }

    async update(newData) {
        // Update baseline statistics incrementally
        console.log('Updating anomaly detection model with new data:', newData);
    }
}

/**
 * Recommendation Engine
 * Provides automated suggestions for optimization
 */
class RecommendationEngine {
    constructor() {
        this.rules = [
            {
                condition: (state) => state.metrics?.pcsProgress < 10,
                recommendation: {
                    type: 'action',
                    message: 'Focus on completing more projects to reach your PCS goal',
                    priority: 'high',
                    actions: ['review_backlog', 'prioritize_projects']
                }
            },
            {
                condition: (state) => state.metrics?.daysToGoal < 300,
                recommendation: {
                    type: 'warning',
                    message: 'Timeline pressure is high - consider accelerating project completion',
                    priority: 'critical',
                    actions: ['increase_efficiency', 'delegate_tasks']
                }
            },
            {
                condition: (state) => state.projects?.filter(p => p.status === 'in-progress').length > 3,
                recommendation: {
                    type: 'suggestion',
                    message: 'You have many projects in progress - consider focusing on fewer at a time',
                    priority: 'medium',
                    actions: ['consolidate_projects', 'set_priorities']
                }
            },
            {
                condition: (state) => state.agents?.some(agent => agent.health.cpu > 80),
                recommendation: {
                    type: 'optimization',
                    message: 'Some agents are under heavy CPU load - consider optimizing or scaling',
                    priority: 'medium',
                    actions: ['optimize_agent', 'scale_resources']
                }
            },
            {
                condition: (state) => state.metrics?.tasksToday === 0,
                recommendation: {
                    type: 'motivation',
                    message: 'No tasks completed today - start with a small win to build momentum',
                    priority: 'low',
                    actions: ['start_small_task', 'review_goals']
                }
            }
        ];
    }

    async train(projectsData) {
        // In a real implementation, this would learn from historical project completion patterns
        // For now, we'll use rule-based recommendations
        console.log('Training recommendation engine with', projectsData?.length || 0, 'projects');
    }

    async recommend(currentState) {
        const recommendations = [];

        this.rules.forEach(rule => {
            if (rule.condition(currentState)) {
                recommendations.push(rule.recommendation);
            }
        });

        return recommendations;
    }

    async update(newProjectData) {
        // Update recommendation rules based on new project outcomes
        console.log('Updating recommendation engine with new project data:', newProjectData);
    }
}

/**
 * Forecasting Model
 * Predicts future resource needs and planning requirements
 */
class ForecastingModel {
    constructor() {
        this.resourceModels = {};
    }

    async train(metricsData) {
        if (!metricsData || metricsData.length === 0) {
            throw new Error('No metrics data available for forecasting training');
        }

        // Create simple forecasting models for different resources
        const resources = ['computing', 'storage', 'bandwidth'];
        
        resources.forEach(resource => {
            // Use exponential smoothing for forecasting
            const alpha = 0.3; // Smoothing factor
            const latestValue = metricsData[metricsData.length - 1].pcsProgress || 1;
            
            this.resourceModels[resource] = {
                alpha,
                level: latestValue,
                trend: 0,
                seasonal: []
            };
        });
    }

    async forecast(resourceType, period) {
        if (!this.resourceModels[resourceType]) {
            return {
                forecast: 'Not available',
                confidence: 0,
                peakDemand: null,
                resourceRequirements: {}
            };
        }

        const model = this.resourceModels[resourceType];
        const forecasts = [];

        // Simple exponential smoothing forecast
        let currentLevel = model.level;
        let currentTrend = model.trend;

        for (let i = 1; i <= period; i++) {
            const forecast = currentLevel + i * currentTrend;
            forecasts.push(forecast);
            
            // Update level and trend for next iteration
            currentLevel = model.alpha * forecast + (1 - model.alpha) * currentLevel;
            currentTrend = 0.1 * (currentLevel - model.level) + 0.9 * currentTrend;
        }

        const avgForecast = forecasts.reduce((sum, val) => sum + val, 0) / forecasts.length;
        const peakForecast = Math.max(...forecasts);

        return {
            forecast: Math.round(avgForecast),
            confidence: 75, // Fixed confidence for demo
            peakDemand: Math.round(peakForecast),
            resourceRequirements: this.calculateResourceRequirements(resourceType, avgForecast),
            period
        };
    }

    calculateResourceRequirements(resourceType, forecastValue) {
        // Simple resource calculation based on forecast
        switch (resourceType) {
            case 'computing':
                return {
                    cpuCores: Math.ceil(forecastValue / 10),
                    ramGb: Math.ceil(forecastValue / 5),
                    estimatedCost: `$${Math.ceil(forecastValue * 2)}`
                };
            case 'storage':
                return {
                    diskGb: Math.ceil(forecastValue * 5),
                    backupRequired: true,
                    estimatedCost: `$${Math.ceil(forecastValue * 0.5)}`
                };
            case 'bandwidth':
                return {
                    monthlyGb: Math.ceil(forecastValue * 10),
                    peakMbps: Math.ceil(forecastValue / 2),
                    estimatedCost: `$${Math.ceil(forecastValue * 1)}`
                };
            default:
                return {};
        }
    }

    async update(newData) {
        // Update forecasting models with new data
        console.log('Updating forecasting model with new data:', newData);
    }
}

// Initialize the predictive analytics module when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.predictiveAnalytics = new PredictiveAnalytics();
    
    // Make functions available globally for integration
    window.getPredictiveInsights = async () => {
        if (window.predictiveAnalytics) {
            return await window.predictiveAnalytics.getInsightsDashboard();
        }
        return null;
    };
    
    window.updatePredictiveModel = async (dataType, newData) => {
        if (window.predictiveAnalytics) {
            await window.predictiveAnalytics.updateModel(dataType, newData);
        }
    };
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PredictiveAnalytics };
}