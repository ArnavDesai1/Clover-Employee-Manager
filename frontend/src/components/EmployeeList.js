import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeAPI from '../services/employeeAPI';
import './EmployeeList.css';

const EmployeeList = ({ refresh }) => {
  const [employees, setEmployees] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
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
      const response = await employeeAPI.getAllEmployees();
      const sorted = [...(response.data || [])].sort((a, b) => (b.id || 0) - (a.id || 0));
      setEmployees(sorted);
      const pendingRes = await employeeAPI.getPendingEmployees();
      setPendingEmployees([...(pendingRes.data || [])].sort((a, b) => (b.id || 0) - (a.id || 0)));
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

  const downloadFile = async (id, type) => {
    const res =
      type === 'profile'
        ? await employeeAPI.downloadProfilePicture(id)
        : await employeeAPI.downloadAddressProof(id);

    const blob = new Blob([res.data], { type: res.headers['content-type'] });
    const url = URL.createObjectURL(blob);
    window.open(url);
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
      await employeeAPI.approveEmployee(id);
      fetchEmployees();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve employee');
    }
  };

  return (
    <div className="container">
      <div className="list-header">
        <h2>Employee Directory</h2>
        <button className="btn-add" onClick={() => navigate('/add')}>
          + Add New Employee
        </button>
      </div>

      {pendingEmployees.length > 0 && (
        <div className="pending-approvals">
          <h3>Pending Approvals ({pendingEmployees.length})</h3>
          <div className="pending-list">
            {pendingEmployees.map((p) => (
              <div key={p.id} className="pending-item">
                <div>
                  <strong>{p.name}</strong>
                  <div>{p.email || 'No email provided'}</div>
                </div>
                <button className="btn-edit" onClick={() => handleApprove(p.id)}>
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? null : employees.length === 0 ? (
        <div className="empty-state">
          <p>No employees found.</p>
        </div>
      ) : (
        <div className="employees-grid">
          {employees.map((e) => (
            <div key={e.id} className="employee-card">
              <div className="card-header">
                <h3>{e.name}</h3>
                <span className="role-badge">{e.role}</span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">ID:</span>
                  <span className="value">#{e.id}</span>
                </div>

                {e.birthdate && (
                  <div className="info-row">
                    <span className="label">Birthdate:</span>
                    <span className="value">{e.birthdate}</span>
                  </div>
                )}

                <div className="info-row">
                  <span className="label">Details:</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => toggleExpanded(e.id)}
                  >
                    {expandedIds.has(e.id) ? 'View less' : 'View more'}
                  </button>
                </div>

                {expandedIds.has(e.id) && (
                  <>
                    {(e.address1 || e.city || e.pin) && (
                      <div className="info-row">
                        <span className="label">Address:</span>
                        <span className="value">
                          {[e.address1, e.address2, e.city, e.state, e.pin]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}

                    {e.gender && (
                      <div className="info-row">
                        <span className="label">Gender:</span>
                        <span className="value">{e.gender}</span>
                      </div>
                    )}

                    {e.hobbies && (
                      <div className="info-row">
                        <span className="label">Hobbies:</span>
                        <span className="value">{e.hobbies}</span>
                      </div>
                    )}

                    {e.pan && (
                      <div className="info-row">
                        <span className="label">PAN:</span>
                        <span className="value">{e.pan}</span>
                      </div>
                    )}

                    <div className="info-row">
                      <span className="label">Profile:</span>
                      {e.profilePicturePath ? (
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => downloadFile(e.id, 'profile')}
                        >
                          Preview / Download
                        </button>
                      ) : (
                        <span className="value value-muted">Not uploaded</span>
                      )}
                    </div>

                    <div className="info-row">
                      <span className="label">Address Proof:</span>
                      {e.addressProofPath ? (
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => downloadFile(e.id, 'proof')}
                        >
                          Preview / Download
                        </button>
                      ) : (
                        <span className="value value-muted">Not uploaded</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="card-actions">
                <button className="btn-edit" onClick={() => navigate(`/edit/${e.id}`)}>
                  Edit
                </button>
                <button className="btn-delete" onClick={() => handleDelete(e.id)}>
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
