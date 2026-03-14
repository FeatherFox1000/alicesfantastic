import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api/auth'
  : 'https://ai-rp-studio.fly.dev/api/site-auth';

function adminRequest(method, path) {
  const token = localStorage.getItem('site_token');
  return fetch(API_BASE + path, {
    method,
    headers: { 'Authorization': `Bearer ${token}` },
  }).then(r => r.json());
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState(() => {
    const cached = sessionStorage.getItem('admin_users');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(!sessionStorage.getItem('admin_users'));

  async function loadUsers() {
    if (!users.length) setLoading(true);
    const data = await adminRequest('GET', '/admin/users');
    if (Array.isArray(data)) {
      setUsers(data);
      sessionStorage.setItem('admin_users', JSON.stringify(data));
    }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function toggleBan(username, isBanned) {
    const action = isBanned ? 'unban' : 'ban';
    setUsers(prev => prev.map(u => u.username === username ? { ...u, is_banned: isBanned ? 0 : 1 } : u));
    await adminRequest('POST', `/admin/${action}/${username}`);
  }

  async function approveAccount(username) {
    setUsers(prev => prev.map(u => u.username === username ? { ...u, parent_consent: 1 } : u));
    await adminRequest('POST', `/admin/approve/${username}`);
  }

  async function toggleAdmin(username, isAdmin) {
    const action = isAdmin ? 'remove-admin' : 'make-admin';
    setUsers(prev => prev.map(u => u.username === username ? { ...u, is_admin: isAdmin ? 0 : 1 } : u));
    await adminRequest('POST', `/admin/${action}/${username}`);
  }

  if (!user?.is_admin) {
    return (
      <div className="admin-panel">
        <h1>Not Authorized</h1>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <p className="admin-subtitle">Manage users on Alice's Fantastic</p>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={u.is_banned ? 'banned-row' : ''}>
                  <td className="username-cell">
                    {u.username}
                    {u.is_admin ? <span className="admin-badge">Admin</span> : null}
                    {u.is_child ? <span className="child-badge">Child</span> : null}
                  </td>
                  <td>{u.email}</td>
                  <td>{new Date(u.created_at + 'Z').toLocaleDateString()}</td>
                  <td>
                    {u.is_banned
                      ? <span className="status-banned">Banned</span>
                      : u.is_child && !u.parent_consent
                        ? <span className="status-pending">Pending Approval</span>
                        : <span className="status-active">Active</span>
                    }
                  </td>
                  <td className="action-cell">
                    {u.is_child && !u.parent_consent && (
                      <button
                        className="approve-btn"
                        onClick={() => approveAccount(u.username)}
                      >
                        Approve
                      </button>
                    )}
                    {u.username !== user.username && (
                      <button
                        className={u.is_banned ? 'unban-btn' : 'ban-btn'}
                        onClick={() => toggleBan(u.username, u.is_banned)}
                      >
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    )}
                    {user.username === 'warrior_cats' && u.username !== 'warrior_cats' && (
                      <button
                        className={u.is_admin ? 'remove-admin-btn' : 'make-admin-btn'}
                        onClick={() => toggleAdmin(u.username, u.is_admin)}
                      >
                        {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="user-count">{users.length} total user{users.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  );
}
