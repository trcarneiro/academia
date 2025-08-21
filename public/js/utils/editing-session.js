(function(){
    'use strict';

    // Small wrapper around sessionStorage for editing-session keys with safe fallbacks
    window.EditingSession = {
        keyPrefix: '',

        _getRaw: function(key) {
            try {
                if (typeof sessionStorage !== 'undefined') return sessionStorage.getItem(key);
            } catch (e) {
                return null;
            }
            return null;
        },

        _setRaw: function(key, value) {
            try {
                if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value);
            } catch (e) {
                console.warn('EditingSession: could not persist key', key, e);
            }
        },

        _removeRaw: function(key) {
            try {
                if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key);
            } catch (e) {
                console.warn('EditingSession: could not remove key', key, e);
            }
        },

        getEditingPlanId: function() {
            return this._getRaw(this.keyPrefix + 'editingPlanId');
        },

        setEditingPlanId: function(id) {
            if (!id) return;
            this._setRaw(this.keyPrefix + 'editingPlanId', String(id));
        },

        clearEditingPlanId: function() {
            this._removeRaw(this.keyPrefix + 'editingPlanId');
        }
    };

})();
