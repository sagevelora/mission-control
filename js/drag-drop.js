// Drag and Drop Functionality for Kanban Board
class KanbanDragDrop {
    constructor() {
        this.draggedItem = null;
        this.currentColumn = null;
        this.init();
    }

    init() {
        // Add event listeners to all task cards
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        
        // Make all task cards draggable
        this.makeTaskCardsDraggable();
    }

    makeTaskCardsDraggable() {
        const taskCards = document.querySelectorAll('.task-card');
        taskCards.forEach(card => {
            card.setAttribute('draggable', 'true');
        });
    }

    handleDragStart(e) {
        // Store the dragged item
        this.draggedItem = e.target.closest('.task-card');
        if (!this.draggedItem) return;
        
        // Add dragging class for visual feedback
        this.draggedItem.classList.add('dragging');
        
        // Set data for drag operation
        const projectId = this.draggedItem.onclick.toString().match(/'([^']+)'/)[1];
        e.dataTransfer.setData('text/plain', projectId);
        e.dataTransfer.effectAllowed = 'move';
        
        // Add ghost image
        const rect = this.draggedItem.getBoundingClientRect();
        const ghost = this.draggedItem.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.top = '-9999px';
        ghost.style.left = '-9999px';
        ghost.style.opacity = '0.7';
        ghost.style.pointerEvents = 'none';
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        
        // Remove ghost after drag
        setTimeout(() => {
            if (ghost.parentNode) {
                ghost.parentNode.removeChild(ghost);
            }
        }, 0);
    }

    handleDragEnd(e) {
        // Remove dragging class
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
        }
        
        // Reset state
        this.draggedItem = null;
        this.currentColumn = null;
        
        // Remove drop zone indicators
        this.removeDropZoneIndicators();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        const column = e.target.closest('.kanban-column');
        if (!column) return;
        
        // Remove previous drop zone indicator
        this.removeDropZoneIndicators();
        
        // Add drop zone indicator to current column
        this.currentColumn = column;
        column.classList.add('drop-zone');
        
        // Add visual indicator
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.style.cssText = `
            height: 4px;
            background: var(--accent-primary);
            margin: 8px 0;
            border-radius: 2px;
            opacity: 0.7;
        `;
        column.querySelector('.task-list').appendChild(indicator);
    }

    handleDragLeave(e) {
        // Only remove indicator if leaving the entire column
        const column = e.target.closest('.kanban-column');
        if (column && !column.contains(e.relatedTarget)) {
            this.removeDropZoneIndicators();
            this.currentColumn = null;
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.draggedItem || !this.currentColumn) {
            this.removeDropZoneIndicators();
            return;
        }
        
        // Get project ID from drag data
        const projectId = e.dataTransfer.getData('text/plain');
        if (!projectId) {
            this.removeDropZoneIndicators();
            return;
        }
        
        // Get target status from column
        const columnTitle = this.currentColumn.querySelector('.column-title').textContent;
        let newStatus;
        switch (columnTitle) {
            case 'Backlog':
                newStatus = 'backlog';
                break;
            case 'In Progress':
                newStatus = 'in-progress';
                break;
            case 'Review':
                newStatus = 'review';
                break;
            case 'Done':
                newStatus = 'done';
                break;
            default:
                this.removeDropZoneIndicators();
                return;
        }
        
        // Move the project
        this.moveProject(projectId, newStatus);
        
        // Clean up
        this.removeDropZoneIndicators();
        this.draggedItem = null;
        this.currentColumn = null;
    }

    moveProject(projectId, newStatus) {
        // Call the global moveProject function if it exists
        if (typeof window.moveProject === 'function') {
            window.moveProject(projectId, newStatus);
        } else {
            // Fallback implementation
            console.log(`Moving project ${projectId} to ${newStatus}`);
            
            // Find the project in the current DOM
            const projectElement = document.querySelector(`[onclick*="'${projectId}'"]`);
            if (projectElement && this.currentColumn) {
                // Remove from current location
                if (projectElement.parentNode) {
                    projectElement.parentNode.removeChild(projectElement);
                }
                
                // Add to new column
                const taskList = this.currentColumn.querySelector('.task-list');
                if (taskList) {
                    // Add animation
                    projectElement.style.opacity = '0';
                    projectElement.style.transform = 'translateY(20px)';
                    taskList.appendChild(projectElement);
                    
                    // Animate in
                    setTimeout(() => {
                        projectElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        projectElement.style.opacity = '1';
                        projectElement.style.transform = 'translateY(0)';
                    }, 10);
                }
            }
        }
    }

    removeDropZoneIndicators() {
        // Remove drop zone class from all columns
        const columns = document.querySelectorAll('.kanban-column');
        columns.forEach(column => {
            column.classList.remove('drop-zone');
        });
        
        // Remove drop indicators
        const indicators = document.querySelectorAll('.drop-indicator');
        indicators.forEach(indicator => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        });
    }

    // Refresh draggable elements when projects are re-rendered
    refreshDraggables() {
        this.makeTaskCardsDraggable();
    }
}

// Initialize drag and drop when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.kanbanDragDrop = new KanbanDragDrop();
});

// Make the class available globally
window.KanbanDragDrop = KanbanDragDrop;