/**
 * 🏢 Organization Selector - Initializer
 * Simple initialization script for the organization selector component
 * Version: 1.0.0
 */

(function() {
    'use strict';
    
    console.log('🏢 [OrgSelector Init] Loading...');
    
    // Wait for DOM and other dependencies
    function init() {
        const button = document.getElementById('orgSelectorBtn');
        const dropdown = document.getElementById('orgDropdown');
        const orgNameSpan = document.getElementById('currentOrgName');
        const orgList = document.getElementById('orgList');
        
        if (!button || !dropdown) {
            console.warn('⚠️ [OrgSelector Init] Elements not found, retrying...');
            setTimeout(init, 500);
            return;
        }
        
        console.log('✅ [OrgSelector Init] Elements found, setting up...');
        
        let isOpen = false;
        let currentOrgId = null;
        let organizations = [];
        
        // Load current organization
        function loadCurrentOrganization() {
            currentOrgId = localStorage.getItem('activeOrganizationId') || 
                          sessionStorage.getItem('activeOrganizationId') ||
                          window.currentOrganizationId ||
                          'ff5ee00e-d8a3-4291-9428-d28b852fb472';
            
            const orgName = localStorage.getItem('activeOrganizationName') || 
                           'Smart Defence';
            
            orgNameSpan.textContent = orgName;
            console.log('✅ [OrgSelector Init] Current org:', orgName);
        }
        
        // Load organizations from API
        async function loadOrganizations() {
            try {
                console.log('📋 [OrgSelector Init] Loading organizations...');
                
                const response = await fetch('/api/organizations', {
                    headers: {
                        'x-organization-id': currentOrgId
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    organizations = data.data || [];
                    console.log(`✅ [OrgSelector Init] Loaded ${organizations.length} organizations`);
                } else {
                    throw new Error(`API returned ${response.status}`);
                }
            } catch (error) {
                console.warn('⚠️ [OrgSelector Init] Error loading organizations:', error.message);
                
                // Fallback to demo organization
                organizations = [{
                    id: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
                    name: 'Smart Defence',
                    slug: 'smart-defence',
                    isActive: true
                }];
            }
            
            renderOrganizations();
        }
        
        // Render organizations list
        function renderOrganizations() {
            if (organizations.length === 0) {
                orgList.innerHTML = '<div class="org-loading">Nenhuma organização encontrada</div>';
                return;
            }
            
            orgList.innerHTML = organizations.map(org => {
                const isActive = org.id === currentOrgId;
                
                return `
                    <div class="org-item ${isActive ? 'active' : ''}" 
                         data-org-id="${org.id}"
                         data-org-name="${org.name}"
                         data-org-slug="${org.slug || ''}">
                        <div class="org-item-icon">🏢</div>
                        <div class="org-item-info">
                            <div class="org-item-name">${org.name}</div>
                            <div class="org-item-details">
                                ${org.slug ? `<span>@${org.slug}</span>` : ''}
                                ${isActive ? '<span class="org-item-badge">✓ Atual</span>' : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add click handlers
            orgList.querySelectorAll('.org-item').forEach(item => {
                item.addEventListener('click', () => {
                    selectOrganization(
                        item.dataset.orgId,
                        item.dataset.orgName,
                        item.dataset.orgSlug
                    );
                });
            });
        }
        
        // Select organization
        function selectOrganization(orgId, orgName, orgSlug) {
            console.log(`🔄 [OrgSelector Init] Switching to:`, orgName);
            
            // Update storage
            localStorage.setItem('activeOrganizationId', orgId);
            localStorage.setItem('activeOrganizationName', orgName);
            if (orgSlug) {
                localStorage.setItem('activeOrganizationSlug', orgSlug);
            }
            
            // Update global
            window.currentOrganizationId = orgId;
            
            // Close dropdown
            close();
            
            // Show notification
            showNotification(`Organização alterada para: ${orgName}`);
            
            // Reload page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
        
        // Toggle dropdown
        function toggle() {
            if (isOpen) {
                close();
            } else {
                open();
            }
        }
        
        function open() {
            dropdown.style.display = 'block';
            button.classList.add('active');
            isOpen = true;
            console.log('📂 [OrgSelector Init] Dropdown opened');
        }
        
        function close() {
            dropdown.style.display = 'none';
            button.classList.remove('active');
            isOpen = false;
            console.log('📁 [OrgSelector Init] Dropdown closed');
        }
        
        // Show notification
        function showNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 99999;
                animation: slideInRight 0.3s ease;
                font-size: 14px;
                font-weight: 500;
            `;
            notification.innerHTML = `
                <span style="margin-right: 8px;">✓</span>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        // Setup event listeners
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle();
        });
        
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !button.contains(e.target)) {
                close();
            }
        });
        
        // Initialize
        loadCurrentOrganization();
        loadOrganizations();
        
        console.log('✅ [OrgSelector Init] Initialized successfully');
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
