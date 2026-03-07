import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL + '/api/submissions';

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
};

// ==================== 稿件 ====================

export const createManuscript = async (data: {
    title: string;
    journalId?: number;
    journalName?: string;
    submissionDate?: string;
    status?: string;
    note?: string;
}) => {
    const res = await axios.post(`${API_BASE}/manuscripts`, data, { headers: getAuthHeaders() });
    return res.data;
};

export const getUserManuscripts = async () => {
    const res = await axios.get(`${API_BASE}/manuscripts`, { headers: getAuthHeaders() });
    return res.data;
};

export const getManuscriptById = async (id: number) => {
    const res = await axios.get(`${API_BASE}/manuscripts/${id}`, { headers: getAuthHeaders() });
    return res.data;
};

export const updateManuscript = async (id: number, data: { title?: string; currentStatus?: string }) => {
    const res = await axios.put(`${API_BASE}/manuscripts/${id}`, data, { headers: getAuthHeaders() });
    return res.data;
};

export const deleteManuscript = async (id: number) => {
    const res = await axios.delete(`${API_BASE}/manuscripts/${id}`, { headers: getAuthHeaders() });
    return res.data;
};

// ==================== 投稿 ====================

export const addSubmission = async (manuscriptId: number, data: {
    journalId?: number;
    journalName?: string;
    submissionDate?: string;
    status?: string;
    note?: string;
}) => {
    const res = await axios.post(`${API_BASE}/manuscripts/${manuscriptId}/submissions`, data, { headers: getAuthHeaders() });
    return res.data;
};

export const updateSubmission = async (submissionId: number, data: {
    journalId?: number;
    journalName?: string;
    submissionDate?: string;
    status?: string;
}) => {
    const res = await axios.put(`${API_BASE}/submissions/${submissionId}`, data, { headers: getAuthHeaders() });
    return res.data;
};

export const deleteSubmission = async (submissionId: number) => {
    const res = await axios.delete(`${API_BASE}/submissions/${submissionId}`, { headers: getAuthHeaders() });
    return res.data;
};

// ==================== 状态历史 ====================

export const addStatusHistory = async (submissionId: number, data: {
    status: string;
    date: string;
    note?: string;
}) => {
    const res = await axios.post(`${API_BASE}/submissions/${submissionId}/status`, data, { headers: getAuthHeaders() });
    return res.data;
};

export const deleteStatusHistory = async (historyId: number) => {
    const res = await axios.delete(`${API_BASE}/status/${historyId}`, { headers: getAuthHeaders() });
    return res.data;
};
