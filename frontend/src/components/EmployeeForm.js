import React, { useEffect, useState, useCallback } from 'react';
import { employeeAPI } from '../services/employeeAPI';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/EmployeeForm.css';

function EmployeeForm({
  selfRegisterEmail = '',
  onEmployeeAdded,
  onSuccessRedirect = '/',
}) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    birthdate: '',
    gender: '',
    hobbies: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pin: '',
    pan: '',
    email: '',
    profilePicturePath: '',
    addressProofPath: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [addressProof, setAddressProof] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();
  const { id } = useParams();
  const isSelfRegistration = !id && !!selfRegisterEmail;

  const states = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
    'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
    'Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
  ];

  const hobbiesOptions = [
    'Reading','Gaming','Sports','Music','Art','Cooking',
    'Traveling','Photography','Writing','Coding'
  ];

  const loadEmployee = useCallback(async () => {
    try {
      const res = await employeeAPI.getEmployeeById(id);
      setFormData(prev => ({
        ...prev,
        ...res.data,
        hobbies: res.data?.hobbies || '',
      }));
    } catch {
      setError('Failed to load employee');
    }
  }, [id]);

  useEffect(() => {
    if (id) loadEmployee();
  }, [id, loadEmployee]);

  useEffect(() => {
    if (!isSelfRegistration) return;
    setFormData((prev) => ({
      ...prev,
      email: selfRegisterEmail.trim().toLowerCase(),
    }));
  }, [isSelfRegistration, selfRegisterEmail]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      let hobbiesList = formData.hobbies ? formData.hobbies.split(',') : [];
      if (checked) hobbiesList.push(value);
      else hobbiesList = hobbiesList.filter(h => h !== value);

      setFormData(prev => ({ ...prev, hobbies: hobbiesList.join(',') }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, type) => {
    if (type === 'profile') setProfilePicture(e.target.files[0]);
    else setAddressProof(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      let response;
      if (id) {
        await employeeAPI.updateEmployee(id, formData);
        if (profilePicture) {
          await employeeAPI.uploadProfilePicture(id, profilePicture);
        }
        if (addressProof) {
          await employeeAPI.uploadAddressProof(id, addressProof, addressProof.type);
        }
      } else {
        response = await employeeAPI.createEmployee(formData, {
          selfRegistration: isSelfRegistration,
        });
        if (profilePicture)
          await employeeAPI.uploadProfilePicture(response.data.id, profilePicture);
        if (addressProof)
          await employeeAPI.uploadAddressProof(response.data.id, addressProof, addressProof.type);
      }
      setSuccess(isSelfRegistration ? 'Application submitted for admin approval.' : 'Employee saved successfully!');
      if (onEmployeeAdded) onEmployeeAdded(response?.data);
      setTimeout(() => navigate(onSuccessRedirect), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save employee');
    }
  };

  const previewExistingFile = async (type) => {
    if (!id) return;
    try {
      const res =
        type === 'profile'
          ? await employeeAPI.downloadProfilePicture(id)
          : await employeeAPI.downloadAddressProof(id);

      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch {
      setError(`Failed to load current ${type === 'profile' ? 'profile picture' : 'address proof'}`);
    }
  };

  return (
    <div className="form-container">
      <h2>{id ? 'Edit Employee' : 'Add New Employee'}</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="employee-form">
        <input name="name" placeholder="Full Name *" value={formData.name} onChange={handleChange} required />
        <input
          name="role"
          placeholder={isSelfRegistration ? 'Requested Role *' : 'Role *'}
          value={formData.role}
          onChange={handleChange}
          required
        />
        <input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} required />

        <select name="gender" value={formData.gender} onChange={handleChange} required>
          <option value="">Select Gender *</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <div className="hobbies-section">
          <label>Hobbies:</label>
          <div className="hobbies-list">
            {hobbiesOptions.map(hobby => (
              <label key={hobby}>
                <input
                  type="checkbox"
                  value={hobby}
                  checked={formData.hobbies?.includes(hobby)}
                  onChange={handleChange}
                />
                {hobby}
              </label>
            ))}
          </div>
        </div>

        <input name="address1" placeholder="Address Line 1 *" value={formData.address1} onChange={handleChange} required />
        <input name="address2" placeholder="Address Line 2" value={formData.address2} onChange={handleChange} />
        <input name="city" placeholder="City *" value={formData.city} onChange={handleChange} required />

        <select name="state" value={formData.state} onChange={handleChange} required>
          <option value="">Select State *</option>
          {states.map(s => <option key={s}>{s}</option>)}
        </select>

        <input name="pin" placeholder="PIN Code *" value={formData.pin} onChange={handleChange} required />
        <input name="pan" placeholder="PAN *" value={formData.pan} onChange={handleChange} required />

        {isSelfRegistration && (
          <input
            name="email"
            placeholder="Email"
            value={formData.email}
            readOnly
            className="form-input-readonly"
          />
        )}

        <div className="file-upload">
          <label>Profile Picture</label>
          <input type="file" accept="image/*" onChange={e => handleFileChange(e,'profile')} />
          {id && formData.profilePicturePath && (
            <div className="existing-file">
              <span className="existing-file-name">Current file: {formData.profilePicturePath}</span>
              <button
                type="button"
                className="btn-link"
                onClick={() => previewExistingFile('profile')}
              >
                Preview current
              </button>
            </div>
          )}
        </div>

        <div className="file-upload">
          <label>Address Proof</label>
          <input type="file" accept=".pdf,.jpg,.png" onChange={e => handleFileChange(e,'proof')} />
          {id && formData.addressProofPath && (
            <div className="existing-file">
              <span className="existing-file-name">Current file: {formData.addressProofPath}</span>
              <button
                type="button"
                className="btn-link"
                onClick={() => previewExistingFile('proof')}
              >
                Preview current
              </button>
            </div>
          )}
        </div>

        <button className="submit-btn">{id ? 'Update' : 'Create'} Employee</button>
      </form>
    </div>
  );
}

export default EmployeeForm;
