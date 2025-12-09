export default class PortalAPI {
    constructor() {
        this.baseUrl = '/api/portal';
    }

    async request(method, endpoint, data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem('portal_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
}

export const api = new PortalAPI();
