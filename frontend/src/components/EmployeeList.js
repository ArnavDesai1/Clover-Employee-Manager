import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeAPI from '../services/employeeAPI';
import './EmployeeList.css';

const EmployeeList = ({ refresh }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [preview, setPreview] = useState({ open: false, url: null, contentType: null });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const toggleExpanded = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const hasMoreDetails = (e) =>
    e.hobbies || e.address1 || e.city || e.state || e.pin || e.pan || e.profilePicturePath || e.addressProofPath;

  useEffect(() => {
    fetchEmployees();
  }, [refresh]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (expandedId == null) return;
    // Keep the selected card in view; modal doesn't change layout.
    const el = document.getElementById(`employee-card-${expandedId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [expandedId]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await employeeAPI.getAllEmployees();
      setEmployees(response.data);
    } catch (err) {
      const msg = err.code === 'ERR_NETWORK' || err.message?.includes('Network')
        ? 'Cannot reach the server. Is the backend running on port 8080?'
        : 'Failed to fetch employees';
      setError(msg);
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

  const getExtension = (contentType) => {
    if (!contentType) return '';
    if (contentType.includes('pdf')) return '.pdf';
    if (contentType.includes('png')) return '.png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
    if (contentType.includes('gif')) return '.gif';
    if (contentType.includes('webp')) return '.webp';
    if (contentType.includes('image/')) return '.jpg';
    return '';
  };

  const detectContentTypeFromBlob = async (blob) => {
    const buf = blob instanceof ArrayBuffer ? blob : await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length < 4) return 'application/octet-stream';
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
    if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x52 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
    return 'application/octet-stream';
  };

  const previewFile = async (id, type) => {
    const res =
      type === 'profile'
        ? await employeeAPI.downloadProfilePicture(id)
        : await employeeAPI.downloadAddressProof(id);
    let contentType = res.headers['content-type'] || '';
    if (typeof contentType === 'string') contentType = contentType.split(';')[0].trim();
    if (!contentType && type === 'profile') contentType = 'image/jpeg';
    if (!contentType || contentType === 'application/octet-stream') {
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
      contentType = await detectContentTypeFromBlob(blob);
    }
    const blob = new Blob([res.data], { type: contentType });
    const url = URL.createObjectURL(blob);
    setPreview({ open: true, url, contentType });
  };

  const closePreview = () => {
    if (preview.url) URL.revokeObjectURL(preview.url);
    setPreview({ open: false, url: null, contentType: null });
  };

  const downloadFile = async (id, type) => {
    const res =
      type === 'profile'
        ? await employeeAPI.downloadProfilePicture(id)
        : await employeeAPI.downloadAddressProof(id);
    let contentType = res.headers['content-type'] || '';
    if (typeof contentType === 'string') contentType = contentType.split(';')[0].trim();
    if (!contentType || contentType === 'application/octet-stream') {
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
      contentType = await detectContentTypeFromBlob(blob);
    }
    const ext = getExtension(contentType);
    const name = type === 'profile' ? `profile_${id}${ext}` : `address_proof_${id}${ext}`;
    const blob = new Blob([res.data], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredEmployees = normalizedSearch
    ? employees.filter((e) => {
        const haystack = [
          e.name,
          e.role,
          e.city,
          e.state,
          e.pan,
          e.id?.toString(),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : employees;

  const expandedEmployee = expandedId == null ? null : employees.find((x) => x.id === expandedId);

  const closeExpanded = () => setExpandedId(null);

  return (
    <div className="container">
      <div className="list-header">
        <h2>Employee Directory</h2>
        <div className="list-search">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, city, or ID"
          />
        </div>
        <button className="btn-add" onClick={() => navigate('/add')}>
          + Add New Employee
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <p>No employees found.</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="empty-state">
          <p>No employees match your search.</p>
        </div>
      ) : (
        <div className="employees-grid">
          {filteredEmployees.map((e) => (
            <React.Fragment key={e.id}>
              <div id={`employee-card-${e.id}`} className="employee-card">
                <div className="card-header">
                  <h3>{e.name}</h3>
                  <span className="role-badge">{e.role}</span>
                </div>

                <div className="card-body">
                  <div className="card-details-summary">
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
                    {e.gender && (
                      <div className="info-row">
                        <span className="label">Gender:</span>
                        <span className="value">{e.gender}</span>
                      </div>
                    )}
                  </div>

                  {hasMoreDetails(e) && (
                    <button type="button" className="btn-view-more" onClick={() => toggleExpanded(e.id)}>
                      View more
                    </button>
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
            </React.Fragment>
          ))}
        </div>
      )}

      <button
        type="button"
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        title="Back to top"
      >
        <span className="back-to-top-icon">↑</span>
      </button>

      {expandedEmployee && (
        <div className="details-modal-overlay" onClick={closeExpanded} role="dialog" aria-modal="true">
          <div className="details-modal" onClick={(ev) => ev.stopPropagation()}>
            <button type="button" className="close-btn" onClick={closeExpanded} aria-label="Close">
              ×
            </button>
            <div className="details-modal-header">
              <h3 className="details-title">{expandedEmployee.name}</h3>
              <div className="details-subtitle">
                #{expandedEmployee.id} • {expandedEmployee.role}
              </div>
            </div>

            <div className="details-modal-body">
              {expandedEmployee.hobbies && (
                <div className="info-row info-row-hobbies">
                  <span className="label">Hobbies:</span>
                  <span className="value">
                    {expandedEmployee.hobbies
                      .split(',')
                      .map((h) => h.trim())
                      .filter(Boolean)
                      .map((hobby) => (
                        <span key={hobby} className="hobby-tag">
                          {hobby}
                        </span>
                      ))}
                  </span>
                </div>
              )}

              {(expandedEmployee.address1 || expandedEmployee.city || expandedEmployee.state || expandedEmployee.pin) && (
                <div className="info-row">
                  <span className="label">Address:</span>
                  <span className="value">
                    {[expandedEmployee.address1, expandedEmployee.address2, expandedEmployee.city, expandedEmployee.state, expandedEmployee.pin]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}

              {expandedEmployee.pan && (
                <div className="info-row">
                  <span className="label">PAN:</span>
                  <span className="value">{expandedEmployee.pan}</span>
                </div>
              )}

              {expandedEmployee.profilePicturePath && (
                <div className="info-row info-row-actions">
                  <span className="label">Profile:</span>
                  <span className="value">
                    <button type="button" className="btn-link" onClick={() => previewFile(expandedEmployee.id, 'profile')}>
                      Preview
                    </button>
                    <span className="link-sep">|</span>
                    <button type="button" className="btn-link" onClick={() => downloadFile(expandedEmployee.id, 'profile')}>
                      Download
                    </button>
                  </span>
                </div>
              )}

              {expandedEmployee.addressProofPath && (
                <div className="info-row info-row-actions">
                  <span className="label">Address Proof:</span>
                  <span className="value">
                    <button type="button" className="btn-link" onClick={() => previewFile(expandedEmployee.id, 'proof')}>
                      Preview
                    </button>
                    <span className="link-sep">|</span>
                    <button type="button" className="btn-link" onClick={() => downloadFile(expandedEmployee.id, 'proof')}>
                      Download
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {preview.open && preview.url && (
        <div className="preview-modal-overlay" onClick={closePreview} role="dialog" aria-modal="true">
          <div className="preview-modal" onClick={(ev) => ev.stopPropagation()}>
            <button type="button" className="close-btn" onClick={closePreview} aria-label="Close">
              ×
            </button>
            <div className="preview-content">
              {preview.contentType && preview.contentType.startsWith('image/') ? (
                <img src={preview.url} alt="Preview" className="preview-image" />
              ) : preview.contentType && preview.contentType.includes('pdf') ? (
                <embed src={preview.url} type="application/pdf" title="Preview" className="preview-embed" />
              ) : preview.contentType && preview.contentType !== 'application/octet-stream' ? (
                <embed src={preview.url} type={preview.contentType} title="Preview" className="preview-embed" />
              ) : (
                <p className="preview-fallback">Preview not available for this file type. Use <strong>Download</strong> to save it.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
