import React, { useEffect, useState, useCallback } from 'react';
import { employeeAPI } from '../services/employeeAPI';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/EmployeeForm.css';

function EmployeeForm({ selfRegisterEmail, onEmployeeAdded, onSuccessRedirect }) {
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
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [addressProof, setAddressProof] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();
  const { id } = useParams();

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

  const loadEmployee = useCallback(async (employeeId) => {
    try {
      const res = await employeeAPI.getEmployeeById(employeeId);
      setFormData(res.data);
    } catch {
      setError('Failed to load employee');
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      if (!cancelled) {
        await loadEmployee(id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, loadEmployee]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      let hobbiesList = formData.hobbies ? formData.hobbies.split(',') : [];
      if (checked) hobbiesList.push(value);
      else hobbiesList = hobbiesList.filter(h => h !== value);

      setFormData(prev => ({ ...prev, hobbies: hobbiesList.join(',') }));
    } else {
      // Clear field-specific error when user edits
      if (fieldErrors[name]) {
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
      }

      if (name === 'pin') {
        const digitsOnly = value.replace(/\s+/g, '');
        if (!/^\d*$/.test(digitsOnly)) {
          setFieldErrors(prev => ({ ...prev, pin: 'PIN code can contain only digits.' }));
        } else {
          setFieldErrors(prev => ({ ...prev, pin: '' }));
        }
        setFormData(prev => ({ ...prev, pin: digitsOnly }));
        return;
      }

      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, type) => {
    if (type === 'profile') setProfilePicture(e.target.files[0]);
    else setAddressProof(e.target.files[0]);
  };

  // Aadhaar checksum using Verhoeff algorithm (client-side only, no API)
  const isValidAadhaar = (value) => {
    const aadhaar = (value || '').replace(/\s+/g, '');
    if (!/^\d{12}$/.test(aadhaar)) return false;

    const d = [
      [0,1,2,3,4,5,6,7,8,9],
      [1,2,3,4,0,6,7,8,9,5],
      [2,3,4,0,1,7,8,9,5,6],
      [3,4,0,1,2,8,9,5,6,7],
      [4,0,1,2,3,9,5,6,7,8],
      [5,9,8,7,6,0,4,3,2,1],
      [6,5,9,8,7,1,0,4,3,2],
      [7,6,5,9,8,2,1,0,4,3],
      [8,7,6,5,9,3,2,1,0,4],
      [9,8,7,6,5,4,3,2,1,0],
    ];
    const p = [
      [0,1,2,3,4,5,6,7,8,9],
      [1,5,7,6,2,8,3,0,9,4],
      [5,8,0,3,7,9,6,1,4,2],
      [8,9,1,6,0,4,3,5,2,7],
      [9,4,5,3,1,2,6,8,7,0],
      [4,2,8,6,5,7,3,9,0,1],
      [2,7,9,3,8,0,6,4,1,5],
      [7,0,4,6,9,1,3,2,5,8],
    ];

    let c = 0;
    const digits = aadhaar.split('').reverse().map(Number);
    for (let i = 0; i < digits.length; i += 1) {
      c = d[c][p[i % 8][digits[i]]];
    }
    return c === 0;
  };

  const validateAddress = () => {
    setFieldErrors(prev => ({ ...prev, city: '', pin: '' }));

    const city = (formData.city || '').trim();
    const rawPin = (formData.pin || '').toString().trim();

    // If both are empty, treat as invalid because address is important
    if (!city || !rawPin) {
      if (!city) {
        setFieldErrors(prev => ({ ...prev, city: 'City is required.' }));
      }
      if (!rawPin) {
        setFieldErrors(prev => ({ ...prev, pin: 'PIN code is required.' }));
      }
      setError('Please enter both City and a 6-digit PIN code.');
      return false;
    }

    if (city.length < 2) {
      setFieldErrors(prev => ({ ...prev, city: 'City name must be at least 2 characters.' }));
      setError('Please enter a valid city name.');
      return false;
    }

    const pinDigits = rawPin.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(pinDigits)) {
      setFieldErrors(prev => ({ ...prev, pin: 'Please enter a valid 6-digit PIN code.' }));
      setError('Please enter a valid 6-digit PIN code.');
      return false;
    }

    // Normalise PIN (no spaces)
    setFormData(prev => ({ ...prev, city: city, pin: pinDigits }));
    return true;
  };

  const validateGovernmentId = () => {
    const raw = (formData.pan || '').trim();

    // Allow empty for now – treat as optional
    if (!raw) {
      return true;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

    if (panRegex.test(raw.toUpperCase()) || isValidAadhaar(raw)) {
      // Normalise PAN to uppercase before submit
      if (panRegex.test(raw.toUpperCase())) {
        setFormData(prev => ({ ...prev, pan: raw.toUpperCase() }));
      }
      return true;
    }

    setError('Please enter a valid PAN (e.g. ABCDE1234F) or a 12-digit Aadhaar number.');
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateAddress() || !validateGovernmentId()) {
      return;
    }

    try {
      let response;
      const payload = id ? formData : { ...formData, ...(selfRegisterEmail ? { email: selfRegisterEmail } : {}) };
      if (id) {
        await employeeAPI.updateEmployee(id, payload);
      } else {
        response = await employeeAPI.createEmployee(payload);
        if (profilePicture)
          await employeeAPI.uploadProfilePicture(response.data.id, profilePicture);
        if (addressProof)
          await employeeAPI.uploadAddressProof(response.data.id, addressProof, addressProof.type);
      }
      setSuccess(id ? 'Updated successfully!' : (selfRegisterEmail ? 'You are now registered in the system.' : 'Employee saved successfully!'));
      if (onEmployeeAdded) onEmployeeAdded();
      const redirectTo = (selfRegisterEmail && onSuccessRedirect) ? onSuccessRedirect : '/';
      setTimeout(() => navigate(redirectTo), 2000);
    } catch (err) {
      setError('Failed to save employee');
    }
  };

  return (
    <div className="form-container">
      <h2>{id ? 'Edit Employee' : selfRegisterEmail ? 'Register as Employee' : 'Add New Employee'}</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="employee-form">
        {selfRegisterEmail && (
          <div className="form-field-with-label">
            <label htmlFor="self-email">Email (linked to your login)</label>
            <input id="self-email" type="email" value={selfRegisterEmail} readOnly disabled className="form-input-readonly" />
          </div>
        )}
        <div className="form-row-basic">
          <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          <input name="role" placeholder="Role" value={formData.role} onChange={handleChange} required />
          <div className="form-field-with-label">
            <label htmlFor="birthdate">Birthdate</label>
            <input id="birthdate" type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} />
          </div>
          <div className="form-field-with-label">
            <label htmlFor="gender">Gender</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

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

        <div className="form-row-address">
          <input name="address1" placeholder="Address Line 1" value={formData.address1} onChange={handleChange} />
          <input name="address2" placeholder="Address Line 2" value={formData.address2} onChange={handleChange} />
          <div>
            <input name="city" placeholder="City" value={formData.city} onChange={handleChange} />
            {fieldErrors.city && <div className="field-error">{fieldErrors.city}</div>}
          </div>
          <select name="state" value={formData.state} onChange={handleChange}>
            <option value="">Select State</option>
            {states.map(s => <option key={s}>{s}</option>)}
          </select>
          <div>
            <input name="pin" placeholder="PIN Code" value={formData.pin} onChange={handleChange} />
            {fieldErrors.pin && <div className="field-error">{fieldErrors.pin}</div>}
          </div>
          <input
            name="pan"
            placeholder="PAN (ABCDE1234F) or 12-digit Aadhaar"
            value={formData.pan}
            onChange={handleChange}
          />
        </div>

        <div className="file-upload">
          <label>Profile Picture</label>
          <input type="file" accept="image/*" onChange={e => handleFileChange(e,'profile')} />
        </div>

        <div className="file-upload">
          <label>Address Proof</label>
          <input type="file" accept=".pdf,.jpg,.png" onChange={e => handleFileChange(e,'proof')} />
        </div>

        <button className="submit-btn">
          {id ? 'Update Employee' : selfRegisterEmail ? 'Register' : 'Create Employee'}
        </button>
      </form>
    </div>
  );
}

export default EmployeeForm;
