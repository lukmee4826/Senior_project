const API_BASE_URL = 'http://127.0.0.1:8000';

export const getAuthToken = () => {
    return localStorage.getItem('token');
};

export const setAuthToken = (token: string) => {
    localStorage.setItem('token', token);
};

export const removeAuthToken = () => {
    localStorage.removeItem('token');
};

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Don't set Content-Type to application/json if it's FormData
    if (!(options.body instanceof FormData)) {
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Handle unauthorized - probably should clear token and redirect to login
        removeAuthToken();
        window.dispatchEvent(new Event('auth-unauthorized'));
    }

    return response;
};
