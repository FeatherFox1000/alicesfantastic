import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../context/AuthContext';
import './ParentalConsent.css';

export default function ParentalConsent() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(API_BASE + '/consent/' + token)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setStatus('error');
          setMessage(data.error);
        } else if (data.pending) {
          setStatus('pending');
          setInfo(data);
        } else {
          setStatus('already_approved');
          setMessage(data.message);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not connect to the server.');
      });
  }, [token]);

  async function approve() {
    setStatus('loading');
    const res = await fetch(API_BASE + '/consent/' + token, { method: 'POST' });
    const data = await res.json();
    setStatus('approved');
    setMessage(data.message);
  }

  async function deny() {
    setStatus('loading');
    const res = await fetch(API_BASE + '/consent/' + token + '/deny', { method: 'POST' });
    const data = await res.json();
    setStatus('denied');
    setMessage(data.message);
  }

  return (
    <div className="consent-page">
      <div className="consent-card">
        <img src="/images/logo.png" alt="Alice's Fantastic" className="consent-logo" />
        <h1>Parental Consent</h1>

        {status === 'loading' && <p>Loading...</p>}

        {status === 'error' && <p className="consent-error">{message}</p>}

        {status === 'pending' && info && (
          <>
            <p>Your child <strong>{info.username}</strong> has created an account on Alice's Fantastic and needs your permission to use it.</p>
            <h3>What we collect:</h3>
            <ul>
              <li>Username (chosen by your child)</li>
              <li>Email address</li>
              <li>Password (stored securely with encryption)</li>
            </ul>
            <h3>What we do with it:</h3>
            <ul>
              <li>Allow your child to log in and play games on our site</li>
              <li>We do NOT sell or share personal information</li>
              <li>We do NOT use tracking or advertising cookies</li>
              <li>We do NOT contact your child by email</li>
            </ul>
            <h3>Your rights:</h3>
            <ul>
              <li>You can deny consent and the account will be deleted</li>
              <li>You can request account deletion at any time by emailing us</li>
              <li>You can review what data we have by emailing us</li>
            </ul>
            <div className="consent-actions">
              <button className="consent-approve" onClick={approve}>I Approve This Account</button>
              <button className="consent-deny" onClick={deny}>Deny and Delete Account</button>
            </div>
          </>
        )}

        {status === 'approved' && <p className="consent-success">{message} Your child can now log in.</p>}
        {status === 'already_approved' && <p className="consent-success">{message}</p>}
        {status === 'denied' && <p>{message}</p>}
      </div>
    </div>
  );
}
