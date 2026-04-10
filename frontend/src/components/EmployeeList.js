import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeAPI from '../services/employeeAPI';
import authAPI from '../services/authAPI';
import './EmployeeList.css';

const EmployeeList = ({ refresh, onManualRefresh }) => {
  const [employees, setEmployees] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [pendingRoleDrafts, setPendingRoleDrafts] = useState({});
  const [blockedEmails, setBlockedEmails] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalFileError, setModalFileError] = useState({ profile: '', proof: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const openDetailsModal = (employee) => {
    setModalFileError({ profile: '', proof: '' });
    setSelectedEmployee(employee);
  };

  const closeDetailsModal = () => {
    setModalFileError({ profile: '', proof: '' });
    setSelectedEmployee(null);
  };

  const hasUploadedFile = (pathValue) => {
    if (!pathValue) return false;
    const normalized = String(pathValue).trim().toLowerCase();
    return normalized !== 'null' && normalized !== 'undefined' && normalized !== 'na' && normalized !== '-';
  };

  const hasDesignationRequest = (employee) => {
    const requested = (employee?.requestedRole || '').trim();
    return !!requested;
  };

  useEffect(() => {
    fetchEmployees();
  }, [refresh]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      await employeeAPI.backfillDemoEmails();

      const [approvedRes, pendingRes, blockedRes] = await Promise.all([
        employeeAPI.getAllEmployees(),
        employeeAPI.getPendingEmployees(),
        authAPI.getBlockedEmails(),
      ]);

      const normalizedBlockedEmails = (blockedRes?.data?.emails || [])
        .map((email) => (email || '').trim().toLowerCase())
        .filter(Boolean);

      const sortedApproved = [...(approvedRes.data || [])].sort((a, b) => (b.id || 0) - (a.id || 0));
      const sortedPending = [...(pendingRes.data || [])].sort((a, b) => (b.id || 0) - (a.id || 0));
      const visibleApproved = sortedApproved.filter(
        (employee) => !normalizedBlockedEmails.includes((employee?.email || '').trim().toLowerCase())
      );
      const visiblePending = sortedPending.filter(
        (employee) => !normalizedBlockedEmails.includes((employee?.email || '').trim().toLowerCase())
      );

      setEmployees(visibleApproved);
      setPendingEmployees(visiblePending);
      setPendingRoleDrafts(
        Object.fromEntries(
          visiblePending.map((employee) => [
            employee.id,
            employee.requestedRole || employee.role || 'Employee',
          ])
        )
      );
      setBlockedEmails(normalizedBlockedEmails);
    } catch (err) {
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = (email) => {
    const normalized = (email || '').trim().toLowerCase();
    return !!normalized && blockedEmails.includes(normalized);
  };

  const handleBlockToggle = async (email) => {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) {
      setError('Employee email is required to block/unblock sign-in.');
      return;
    }
    if (!EMAIL_REGEX.test(normalized)) {
      setError('Employee must have a valid email to block/unblock sign-in.');
      return;
    }
    try {
      if (isBlocked(normalized)) {
        await authAPI.unblockEmail(normalized);
      } else {
        await authAPI.blockEmail(normalized);
      }
      fetchEmployees();
    } catch {
      setError('Failed to update blocklist.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this employee?')) {
      try {
        await employeeAPI.deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to delete employee');
      }
    }
  };

  const previewFile = async (id, type, onError) => {
    const previewTab = window.open('about:blank', '_blank');
    if (previewTab) {
      try {
        previewTab.opener = null;
      } catch {}
    }
    try {
      const res =
        type === 'profile'
          ? await employeeAPI.downloadProfilePicture(id)
          : await employeeAPI.downloadAddressProof(id);
      const contentType = res.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      if (previewTab && !previewTab.closed) {
        previewTab.location.href = url;
      } else {
        window.location.assign(url);
      }
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch (err) {
      if (previewTab && !previewTab.closed) previewTab.close();
      if (onError) onError(`File is not available for ${type === 'profile' ? 'profile preview' : 'proof preview'}.`);
      else setError('File is not available for preview.');
    }
  };

  const downloadFile = async (id, type, nameHint = 'document', onError) => {
    try {
      const res =
        type === 'profile'
          ? await employeeAPI.downloadProfilePicture(id)
          : await employeeAPI.downloadAddressProof(id);

      const contentType = res.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
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
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if (onError) onError(`File is not available for ${type === 'profile' ? 'profile download' : 'proof download'}.`);
      else setError('File is not available for download.');
    }
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
    return [employee.name, employee.email, employee.role]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(q));
  });

  return (
    <div className="container">
      <div className="list-header">
        <h2>Employee Directory</h2>
        <div className="list-header-actions">
          <button
            type="button"
            className="btn-refresh"
            title="Refresh Directory"
            aria-label="Refresh Directory"
            onClick={() => {
              fetchEmployees();
              if (onManualRefresh) onManualRefresh();
            }}
          >
            ↻
          </button>
          <button className="btn-add" onClick={() => navigate('/add')}>
            + Add New Employee
          </button>
        </div>
      </div>

      <div className="list-toolbar">
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, role, or email..."
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
                    {hasDesignationRequest(employee) ? (
                      <span>
                        Designation change request: <strong>{employee.role || 'N/A'}</strong> to <strong>{employee.requestedRole}</strong>
                      </span>
                    ) : (
                      <span>New employee approval request</span>
                    )}
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
                  <div className="file-actions pending-file-actions">
                    {hasUploadedFile(employee.profilePicturePath) ? (
                      <>
                        <button type="button" className="btn-link" onClick={() => previewFile(employee.id, 'profile')}>
                          Preview Profile
                        </button>
                        <button type="button" className="btn-link" onClick={() => downloadFile(employee.id, 'profile', `profile_${employee.id}`)}>
                          Download Profile
                        </button>
                      </>
                    ) : (
                      <span className="value value-muted">Profile not uploaded</span>
                    )}
                  </div>
                  <div className="file-actions pending-file-actions">
                    {hasUploadedFile(employee.addressProofPath) ? (
                      <>
                        <button type="button" className="btn-link" onClick={() => previewFile(employee.id, 'proof')}>
                          Preview Proof
                        </button>
                        <button type="button" className="btn-link" onClick={() => downloadFile(employee.id, 'proof', `address_proof_${employee.id}`)}>
                          Download Proof
                        </button>
                      </>
                    ) : (
                      <span className="value value-muted">Address proof not uploaded</span>
                    )}
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
                  <button className="btn-edit" onClick={() => handleApprove(employee.id)}>
                    {hasDesignationRequest(employee) ? 'Approve Designation' : 'Approve Employee'}
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

                {employee.city && (
                  <div className="info-row">
                    <span className="label">City:</span>
                    <span className="value">{employee.city}</span>
                  </div>
                )}

                <div className="info-row">
                  <span className="label">Details:</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => openDetailsModal(employee)}
                  >
                    View more
                  </button>
                </div>
              </div>

              <div className="card-actions">
                <button type="button" className="btn-edit" onClick={() => navigate(`/edit/${employee.id}`)}>
                  Edit
                </button>
                <button type="button" className="btn-delete" onClick={() => handleBlockToggle(employee.email)}>
                  {isBlocked(employee.email) ? 'Unblock Login' : 'Block Login'}
                </button>
                <button type="button" className="btn-delete" onClick={() => handleDelete(employee.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEmployee && (
        <div className="preview-modal-overlay" onClick={closeDetailsModal}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{selectedEmployee.name} - Details</h3>
              <button className="close-btn" onClick={closeDetailsModal}>×</button>
            </div>
            <div className="preview-content details-modal-content">
              <div className="details-grid">
                <div className="info-row"><span className="label">ID:</span><span className="value">#{selectedEmployee.id}</span></div>
                <div className="info-row"><span className="label">Role:</span><span className="value">{selectedEmployee.role}</span></div>
                {selectedEmployee.birthdate && <div className="info-row"><span className="label">Birthdate:</span><span className="value">{selectedEmployee.birthdate}</span></div>}
                {selectedEmployee.gender && <div className="info-row"><span className="label">Gender:</span><span className="value">{selectedEmployee.gender}</span></div>}
                {selectedEmployee.hobbies && <div className="info-row"><span className="label">Hobbies:</span><span className="value">{selectedEmployee.hobbies}</span></div>}
                {selectedEmployee.pan && <div className="info-row"><span className="label">PAN:</span><span className="value">{selectedEmployee.pan}</span></div>}
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{selectedEmployee.email || 'Not available'}</span>
                </div>
                {(selectedEmployee.address1 || selectedEmployee.city || selectedEmployee.pin) && (
                  <div className="info-row">
                    <span className="label">Address:</span>
                    <span className="value">
                      {[selectedEmployee.address1, selectedEmployee.address2, selectedEmployee.city, selectedEmployee.state, selectedEmployee.pin]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">Profile:</span>
                  {hasUploadedFile(selectedEmployee.profilePicturePath) ? (
                    <div className="file-actions">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() =>
                          previewFile(
                            selectedEmployee.id,
                            'profile',
                            (message) => setModalFileError((prev) => ({ ...prev, profile: message }))
                          )
                        }
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() =>
                          downloadFile(
                            selectedEmployee.id,
                            'profile',
                            `profile_${selectedEmployee.id}`,
                            (message) => setModalFileError((prev) => ({ ...prev, profile: message }))
                          )
                        }
                      >
                        Download
                      </button>
                    </div>
                  ) : (
                    <span className="value value-muted">Not uploaded</span>
                  )}
                </div>
                {modalFileError.profile && (
                  <div className="inline-file-error">{modalFileError.profile}</div>
                )}
                <div className="info-row">
                  <span className="label">Address Proof:</span>
                  {hasUploadedFile(selectedEmployee.addressProofPath) ? (
                    <div className="file-actions">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() =>
                          previewFile(
                            selectedEmployee.id,
                            'proof',
                            (message) => setModalFileError((prev) => ({ ...prev, proof: message }))
                          )
                        }
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() =>
                          downloadFile(
                            selectedEmployee.id,
                            'proof',
                            `address_proof_${selectedEmployee.id}`,
                            (message) => setModalFileError((prev) => ({ ...prev, proof: message }))
                          )
                        }
                      >
                        Download
                      </button>
                    </div>
                  ) : (
                    <span className="value value-muted">Not uploaded</span>
                  )}
                </div>
                {modalFileError.proof && (
                  <div className="inline-file-error">{modalFileError.proof}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
