import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

export const uploadFir = async (file, caseNumber = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (caseNumber) {
    formData.append('case_number', caseNumber);
  }
  const response = await axios.post(`${API_URL}/upload/fir`, formData);
  return response.data;
};

export const uploadCdr = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/upload/cdr`, formData);
  return response.data;
};

export const processUploads = async (uploadIds = ["mock_1"]) => {
  const response = await axios.post(`${API_URL}/process`, {
    upload_ids: uploadIds,
    options: {
      run_entity_resolution: true,
      build_graph: true,
      run_analytics: true,
      calculate_risk: true
    }
  });
  return response.data;
};

export const getNetworkGraph = async (uploadIds = []) => {
  const params = {};
  if (uploadIds && uploadIds.length > 0) {
    params.upload_ids = uploadIds.join(',');
  }
  const response = await axios.get(`${API_URL}/graph`, { params });
  return response.data;
};

export const searchEntities = async (query) => {
  const response = await axios.get(`${API_URL}/search`, { params: { q: query } });
  return response.data;
};

export const runAnalytics = async () => {
  const response = await axios.post(`${API_URL}/analytics/run`);
  return response.data;
};

export const clearDatabase = async () => {
  const response = await axios.post(`${API_URL}/clear`);
  return response.data;
};

export const getUploads = async () => {
  const response = await axios.get(`${API_URL}/uploads`);
  return response.data;
};

export const deleteUpload = async (uploadId) => {
  const response = await axios.delete(`${API_URL}/upload/${uploadId}`);
  return response.data;
};
