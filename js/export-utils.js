/**
 * Export Utilities for Mission Control Dashboard
 * Handles CSV and PDF export functionality
 */

class ExportUtils {
    /**
     * Export dashboard data to CSV format
     * @param {Object} data - The data to export
     * @param {string} filename - The filename for the exported file
     */
    static exportToCSV(data, filename = 'mission-control-export.csv') {
        // Prepare CSV content
        let csvContent = 'Mission Control Data Export\n';
        csvContent += `Export Date: ${new Date().toISOString()}\n\n`;
        
        // Metrics section
        if (data.metrics) {
            csvContent += 'METRICS\n';
            csvContent += 'Key,Value\n';
            Object.entries(data.metrics).forEach(([key, value]) => {
                csvContent += `${key},${value}\n`;
            });
            csvContent += '\n';
        }
        
        // Projects section
        if (data.projects && data.projects.length > 0) {
            csvContent += 'PROJECTS\n';
            csvContent += 'ID,Title,Description,Status,Priority,Created At\n';
            data.projects.forEach(project => {
                csvContent += `"${project.id}","${project.title.replace(/"/g, '""')}","${project.description.replace(/"/g, '""')}","${project.status}","${project.priority}","${project.createdAt}"\n`;
            });
            csvContent += '\n';
        }
        
        // Agents section
        if (data.agents && data.agents.length > 0) {
            csvContent += 'AGENTS\n';
            csvContent += 'ID,Name,Status,CPU (%),Memory (MB),Response Time (ms),Uptime (s),Capabilities\n';
            data.agents.forEach(agent => {
                const capabilities = agent.capabilities ? agent.capabilities.join('; ') : '';
                csvContent += `"${agent.id}","${agent.name.replace(/"/g, '""')}","${agent.status}",${agent.health.cpu},${agent.health.memory},${agent.health.responseTime},${agent.uptimeSeconds},"${capabilities.replace(/"/g, '""')}"\n`;
            });
            csvContent += '\n';
        }
        
        // Activity Log section
        if (data.activityLog && data.activityLog.length > 0) {
            csvContent += 'ACTIVITY LOG\n';
            csvContent += 'Timestamp,Message\n';
            data.activityLog.forEach(item => {
                csvContent += `"${item.timestamp}","${item.message.replace(/"/g, '""')}"\n`;
            });
            csvContent += '\n';
        }
        
        // Priorities section
        if (data.priorities && data.priorities.length > 0) {
            csvContent += 'PRIORITIES\n';
            csvContent += 'ID,Text,Completed,Created At\n';
            data.priorities.forEach(priority => {
                csvContent += `"${priority.id}","${priority.text.replace(/"/g, '""')}",${priority.completed},"${priority.createdAt}"\n`;
            });
        }
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return true;
    }
    
    /**
     * Export dashboard data to PDF format
     * @param {Object} data - The data to export
     * @param {string} filename - The filename for the exported file
     * @param {Object} options - Additional options for PDF export
     */
    static exportToPDF(data, filename = 'mission-control-export.pdf', options = {}) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set up document
        doc.setFontSize(20);
        doc.text('Mission Control Dashboard Export', 14, 20);
        doc.setFontSize(12);
        doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 30);
        
        let yPos = 40;
        
        // Add metrics section
        if (data.metrics) {
            doc.setFontSize(16);
            doc.text('Metrics Overview', 14, yPos);
            yPos += 12;
            doc.setFontSize(12);
            
            const metricsEntries = Object.entries(data.metrics);
            metricsEntries.forEach(([key, value]) => {
                const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                doc.text(`${displayKey}: ${value}`, 14, yPos);
                yPos += 8;
                
                // Handle page breaks
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
            });
            yPos += 10;
        }
        
        // Add projects summary
        if (data.projects && data.projects.length > 0) {
            doc.setFontSize(16);
            doc.text('Projects Summary', 14, yPos);
            yPos += 12;
            doc.setFontSize(12);
            
            doc.text(`Total Projects: ${data.projects.length}`, 14, yPos);
            yPos += 8;
            doc.text(`Active Projects: ${data.projects.filter(p => p.status === 'in-progress').length}`, 14, yPos);
            yPos += 8;
            doc.text(`Completed Projects: ${data.projects.filter(p => p.status === 'done').length}`, 14, yPos);
            yPos += 10;
            
            // Handle page breaks
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
        }
        
        // Add agents summary
        if (data.agents && data.agents.length > 0) {
            doc.setFontSize(16);
            doc.text('Agents Summary', 14, yPos);
            yPos += 12;
            doc.setFontSize(12);
            
            doc.text(`Total Agents: ${data.agents.length}`, 14, yPos);
            yPos += 8;
            
            // Calculate health metrics
            const healthyAgents = data.agents.filter(a => 
                a.health.cpu < 80 && 
                a.health.memory < 800 && 
                a.health.responseTime < 200
            ).length;
            doc.text(`Healthy Agents: ${healthyAgents}/${data.agents.length}`, 14, yPos);
            yPos += 10;
            
            // Handle page breaks
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
        }
        
        // Add charts if requested and available
        if (options.includeCharts && data.charts) {
            // Note: In a real implementation, you would convert canvas elements to images
            // This is a placeholder for the chart export functionality
            doc.setFontSize(16);
            doc.text('Charts', 14, yPos);
            yPos += 12;
            doc.setFontSize(12);
            doc.text('Chart images would be included here in a complete implementation.', 14, yPos);
            yPos += 10;
        }
        
        // Save the PDF
        doc.save(filename);
        return true;
    }
    
    /**
     * Export data based on user preferences
     * @param {Object} data - The data to export
     * @param {string} format - The export format ('csv', 'pdf', or 'both')
     * @param {Object} options - Additional export options
     */
    static exportData(data, format = 'csv', options = {}) {
        const timestamp = new Date().toISOString().split('T')[0];
        const baseFilename = `mission-control-export-${timestamp}`;
        
        try {
            if (format === 'csv' || format === 'both') {
                this.exportToCSV(data, `${baseFilename}.csv`);
            }
            
            if (format === 'pdf' || format === 'both') {
                this.exportToPDF(data, `${baseFilename}.pdf`, options);
            }
            
            return { success: true, message: `Data exported successfully in ${format} format` };
        } catch (error) {
            console.error('Export error:', error);
            return { success: false, message: `Export failed: ${error.message}` };
        }
    }
}

// Make ExportUtils available globally
window.ExportUtils = ExportUtils;