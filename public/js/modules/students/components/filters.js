/**
 * Students Filters Component
 * Handles search and filtering functionality for students list
 */

export class StudentsFilters {
    constructor() {
        this.searchTerm = '';
        this.filters = {
            status: 'all',
            category: 'all'
        };
        this.onFilterChange = null;
        this.searchTimeout = null;
    }

    /**
     * Initialize filters in container
     */
    init(container) {
        this.container = container;
        this.bindEvents();
    }

    /**
     * Set filter change callback
     */
    setFilterChangeCallback(callback) {
        this.onFilterChange = callback;
    }

    /**
     * Bind filter events
     */
    bindEvents() {
        if (!this.container) return;

        // Search input
        const searchInput = this.container.querySelector('#students-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchChange(e.target.value);
            });
        }

        // Status filter
        const statusFilter = this.container.querySelector('#status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.handleFilterChange('status', e.target.value);
            });
        }

        // Category filter
        const categoryFilter = this.container.querySelector('#category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleFilterChange('category', e.target.value);
            });
        }
    }

    /**
     * Handle search input with debouncing
     */
    handleSearchChange(value) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.searchTerm = value;
            this.triggerFilterChange();
        }, 300);
    }

    /**
     * Handle filter dropdown changes
     */
    handleFilterChange(filterType, value) {
        this.filters[filterType] = value;
        this.triggerFilterChange();
    }

    /**
     * Trigger filter change callback
     */
    triggerFilterChange() {
        if (this.onFilterChange) {
            this.onFilterChange(this.searchTerm, this.filters);
        }
    }

    /**
     * Reset all filters
     */
    reset() {
        this.searchTerm = '';
        this.filters = {
            status: 'all',
            category: 'all'
        };

        // Update UI
        if (this.container) {
            const searchInput = this.container.querySelector('#students-search');
            const statusFilter = this.container.querySelector('#status-filter');
            const categoryFilter = this.container.querySelector('#category-filter');

            if (searchInput) searchInput.value = '';
            if (statusFilter) statusFilter.value = 'all';
            if (categoryFilter) categoryFilter.value = 'all';
        }

        this.triggerFilterChange();
    }

    /**
     * Get current filter state
     */
    getState() {
        return {
            searchTerm: this.searchTerm,
            filters: { ...this.filters }
        };
    }

    /**
     * Set filter state
     */
    setState(searchTerm, filters) {
        this.searchTerm = searchTerm || '';
        this.filters = { ...this.filters, ...filters };

        // Update UI
        if (this.container) {
            const searchInput = this.container.querySelector('#students-search');
            const statusFilter = this.container.querySelector('#status-filter');
            const categoryFilter = this.container.querySelector('#category-filter');

            if (searchInput) searchInput.value = this.searchTerm;
            if (statusFilter) statusFilter.value = this.filters.status;
            if (categoryFilter) categoryFilter.value = this.filters.category;
        }
    }
}
