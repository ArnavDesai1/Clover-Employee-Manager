import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeAPI from '../services/employeeAPI';
import './EmployeeList.css';

const EmployeeList = ({ refresh }) => {
  const [employees, setEmployees] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [pendingRoleDrafts, setPendingRoleDrafts] = useState({});
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, [refresh]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const [approvedRes, pendingRes] = await Promise.all([
        employeeAPI.getAllEmployees(),
        employeeAPI.getPendingEmployees(),
      ]);

      const sortedApproved = [...(approvedRes.data || [])].sort((a, b) => (b.id || 0) - (a.id || 0));
      const sortedPending = [...(pendingRes.data || [])].sort((a, b) => (b.id || 0) - (a.id || 0));

      setEmployees(sortedApproved);
      setPendingEmployees(sortedPending);
      setPendingRoleDrafts(
        Object.fromEntries(
          sortedPending.map((employee) => [employee.id, employee.role || 'Employee'])
        )
      );
    } catch (err) {
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this employee?')) {
      await employeeAPI.deleteEmployee(id);
      fetchEmployees();
    }
  };

  const createObjectUrl = async (id, type) => {
    const res =
      type === 'profile'
        ? await employeeAPI.downloadProfilePicture(id)
        : await employeeAPI.downloadAddressProof(id);

    const blob = new Blob([res.data], { type: res.headers['content-type'] });
    return {
      url: URL.createObjectURL(blob),
      contentType: res.headers['content-type'] || 'application/octet-stream',
    };
  };

  const previewFile = async (id, type) => {
    const { url } = await createObjectUrl(id, type);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = async (id, type, nameHint = 'document') => {
    const { url, contentType } = await createObjectUrl(id, type);
    const ext =
      contentType.includes('pdf') ? 'pdf' :
      contentType.includes('png') ? 'png' :
      contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'bin';

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${nameHint}.${ext}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async (id) => {
    try {
      await employeeAPI.approveEmployee(id, pendingRoleDrafts[id]);
      fetchEmployees();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve employee');
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return [
      employee.name,
      employee.role,
      employee.city,
      employee.email,
      String(employee.id || ''),
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(q));
  });

  return (
    <div className="container">
      <div className="list-header">
        <h2>Employee Directory</h2>
        <button className="btn-add" onClick={() => navigate('/add')}>
          + Add New Employee
        </button>
      </div>

      <div className="list-toolbar">
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, role, city, email, or ID..."
        />
      </div>

      {pendingEmployees.length > 0 && (
        <div className="pending-approvals">
          <h3>Pending Approvals ({pendingEmployees.length})</h3>
          <div className="pending-list">
            {pendingEmployees.map((employee) => (
              <div key={employee.id} className="pending-item">
                <div className="pending-main">
                  <div className="pending-title">
                    <strong>{employee.name}</strong>
                    <span className="pending-id">#{employee.id}</span>
                  </div>
                  <div className="pending-meta">
                    <span>{employee.email || 'No email'}</span>
                    <span>{employee.city || 'No city'}</span>
                    <span>{employee.pan || 'No PAN'}</span>
                  </div>
                  <div className="pending-address">
                    {[employee.address1, employee.address2, employee.city, employee.state, employee.pin]
                      .filter(Boolean)
                      .join(', ') || 'Address not provided'}
                  </div>
                </div>

                <div className="pending-actions">
                  <label className="pending-role-label">
                    Role to approve
                    <input
                      type="text"
                      value={pendingRoleDrafts[employee.id] || ''}
                      onChange={(e) =>
                        setPendingRoleDrafts((prev) => ({ ...prev, [employee.id]: e.target.value }))
                      }
                    />
                  </label>
                  {employee.profilePicturePath ? (
                    <div className="file-actions">
                      <button type="button" className="btn-link" onClick={() => previewFile(employee.id, 'profile')}>
                        Preview Profile
                      </button>
                      <button type="button" className="btn-link" onClick={() => downloadFile(employee.id, 'profile', `profile_${employee.id}`)}>
                        Download Profile
                      </button>
                    </div>
                  ) : (
                    <span className="value value-muted">Profile not uploaded</span>
                  )}

                  {employee.addressProofPath ? (
                    <div className="file-actions">
                      <button type="button" className="btn-link" onClick={() => previewFile(employee.id, 'proof')}>
                        Preview Proof
                      </button>
                      <button type="button" className="btn-link" onClick={() => downloadFile(employee.id, 'proof', `address_proof_${employee.id}`)}>
                        Download Proof
                      </button>
                    </div>
                  ) : (
                    <span className="value value-muted">Address proof not uploaded</span>
                  )}
                  <button className="btn-edit" onClick={() => handleApprove(employee.id)}>
                    Approve Employee
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? null : filteredEmployees.length === 0 ? (
        <div className="empty-state">
          <p>No employees found.</p>
        </div>
      ) : (
        <div className="employees-grid">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="employee-card">
              <div className="card-header">
                <h3>{employee.name}</h3>
                <span className="role-badge">{employee.role}</span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">ID:</span>
                  <span className="value">#{employee.id}</span>
                </div>

                {employee.birthdate && (
                  <div className="info-row">
                    <span className="label">Birthdate:</span>
                    <span className="value">{employee.birthdate}</span>
                  </div>
                )}

                <div className="info-row">
                  <span className="label">Details:</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => toggleExpanded(employee.id)}
                  >
                    {expandedIds.has(employee.id) ? 'View less' : 'View more'}
                  </button>
                </div>

                {expandedIds.has(employee.id) && (
                  <>
                    {(employee.address1 || employee.city || employee.pin) && (
                      <div className="info-row">
                        <span className="label">Address:</span>
                        <span className="value">
                          {[employee.address1, employee.address2, employee.city, employee.state, employee.pin]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}

                    {employee.gender && (
                      <div className="info-row">
                        <span className="label">Gender:</span>
                        <span className="value">{employee.gender}</span>
                      </div>
                    )}

                    {employee.hobbies && (
                      <div className="info-row">
                        <span className="label">Hobbies:</span>
                        <span className="value">{employee.hobbies}</span>
                      </div>
                    )}

                    {employee.pan && (
                      <div className="info-row">
                        <span className="label">PAN:</span>
                        <span className="value">{employee.pan}</span>
                      </div>
                    )}

                    <div className="info-row">
                      <span className="label">Profile:</span>
                      {employee.profilePicturePath ? (
                        <div className="file-actions">
                          <button type="button" className="btn-link" onClick={() => previewFile(employee.id, 'profile')}>
                            Preview
                          </button>
                          <button type="button" className="btn-link" onClick={() => downloadFile(employee.id, 'profile', `profile_${employee.id}`)}>
                            Download
                          </button>
                        </div>
                      ) : (
                        <span className="value value-muted">Not uploaded</span>
                      )}
                    </div>

                    <div className="info-row">
                      <span className="label">Address Proof:</span>
                      {employee.addressProofPath ? (
                        <div className="file-actions">
                          <button type="button" className="btn-link" onClick={() => previewFile(employee.id, 'proof')}>
                            Preview
                          </button>
                          <button type="button" className="btn-link" onClick={() => downloadFile(employee.id, 'proof', `address_proof_${employee.id}`)}>
                            Download
                          </button>
                        </div>
                      ) : (
                        <span className="value value-muted">Not uploaded</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="card-actions">
                <button className="btn-edit" onClick={() => navigate(`/edit/${employee.id}`)}>
                  Edit
                </button>
                <button className="btn-delete" onClick={() => handleDelete(employee.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
