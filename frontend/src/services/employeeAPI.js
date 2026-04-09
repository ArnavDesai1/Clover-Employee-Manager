import axios from 'axios';

// Local: empty = proxy to backend. Production (Vercel): set REACT_APP_API_URL to your Render backend URL.
const API_BASE = process.env.REACT_APP_API_URL || '';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const employeeAPI = {
  // Get all employees
  getAllEmployees: () => {
    return axiosInstance.get('/employees');
  },

  // Get employee by ID
  getEmployeeById: (id) => {
    return axiosInstance.get(`/employees/${id}`);
  },

  // Get employee by login email (for employee portal "my profile")
  getEmployeeByEmail: (email) => {
    return axiosInstance.get(`/employees/by-email`, {
      params: { email: email || '' },
    });
  },

  // Create new employee
  createEmployee: (employee, options = {}) => {
    return axiosInstance.post('/employees', employee, {
      params: {
        selfRegistration: options.selfRegistration ? 'true' : 'false',
      },
    });
  },

  // Update employee
  updateEmployee: (id, employee) => {
    return axiosInstance.put(`/employees/${id}`, employee);
  },

  // Delete employee
  deleteEmployee: (id) => {
    return axiosInstance.delete(`/employees/${id}`);
  },

  // Pending employee applications (for admin approval)
  getPendingEmployees: () => {
    return axiosInstance.get('/employees/pending');
  },

  approveEmployee: (id) => {
    return axiosInstance.put(`/employees/${id}/approve`);
  },

  // Upload profile picture
  uploadProfilePicture: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(
      `/employees/${id}/profile-picture`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  // Upload address proof
  uploadAddressProof: (id, file, proofType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('proofType', proofType);
    return axiosInstance.post(
      `/employees/${id}/address-proof`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  // Download profile picture
  downloadProfilePicture: (id) => {
    return axiosInstance.get(`/employees/${id}/profile-picture`, {
      responseType: 'blob',
    });
  },

  // Download address proof
  downloadAddressProof: (id) => {
    return axiosInstance.get(`/employees/${id}/address-proof`, {
      responseType: 'blob',
    });
  },
};

export default employeeAPI;
