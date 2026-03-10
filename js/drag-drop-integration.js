/**
 * Drag and Drop Integration for Mission Control Dashboard
 * This file handles the integration between the KanbanDragDrop class and the main dashboard
 */

// Global reference to the drag-drop instance
let kanbanDragDropInstance = null;

// Initialize drag and drop functionality
function initializeDragAndDrop() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDragAndDrop);
    } else {
        initDragAndDrop();
    }
}

// Actual initialization function
function initDragAndDrop() {
    // Create drag-drop instance if it doesn't exist
    if (!kanbanDragDropInstance) {
        kanbanDragDropInstance = new KanbanDragDrop();
    }
    
    // Ensure all task cards are draggable
    refreshDraggableElements();
    
    // Add event listener for when projects are re-rendered
    document.addEventListener('projectsRendered', refreshDraggableElements);
}

// Refresh draggable elements when projects are updated
function refreshDraggableElements() {
    if (kanbanDragDropInstance && typeof kanbanDragDropInstance.refreshDraggables === 'function') {
        kanbanDragDropInstance.refreshDraggables();
    }
}

// Enhanced moveProject function that handles both UI updates and API calls
async function moveProject(projectId, newStatus) {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) {
        console.error('Project not found:', projectId);
        return;
    }
    
    // Update local state immediately for responsive UI
    const oldStatus = project.status;
    project.status = newStatus;
    project.updatedAt = new Date().toISOString();
    
    // Handle queued status for In Progress projects
    if (newStatus === 'in-progress') {
        const inProgressProjects = state.projects.filter(p => p.status === 'in-progress');
        if (inProgressProjects.length > 1) {
            // Mark all but the first as queued
            inProgressProjects.forEach((p, index) => {
                p.queued = index > 0;
                if (p.queued && !p.tags.includes('Queued')) {
                    p.tags.push('Queued');
                } else if (!p.queued) {
                    p.tags = p.tags.filter(tag => tag !== 'Queued');
                }
            });
        }
    } else {
        // Remove queued status when moving out of In Progress
        project.queued = false;
        project.tags = project.tags.filter(tag => tag !== 'Queued');
    }
    
    try {
        // Make API call to update project status on server
        const response = await fetch(`${CONFIG.VPS_URL}/api/projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: newStatus,
                queued: project.queued,
                tags: project.tags,
                updatedAt: project.updatedAt
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Re-render the board to reflect changes
        renderProjects();
        saveToLocalStorage();
        
        // Show success notification
        showNotification(`Project moved to ${newStatus}!`, 'success');
        
        // Dispatch custom event for other components to listen to
        document.dispatchEvent(new CustomEvent('projectMoved', {
            detail: { projectId, oldStatus, newStatus }
        }));
        
    } catch (error) {
        console.error('Error updating project status:', error);
        
        // Revert local changes on error
        project.status = oldStatus;
        renderProjects();
        
        // Show error notification
        showNotification(`Failed to move project: ${error.message}`, 'error');
    }
}

// Make functions available globally
window.initializeDragAndDrop = initializeDragAndDrop;
window.refreshDraggableElements = refreshDraggableElements;
window.moveProject = moveProject;

// Auto-initialize when loaded
initializeDragAndDrop();