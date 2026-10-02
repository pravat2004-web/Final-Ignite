import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FORM_ENDPOINTS } from '../config.js';

const emptyForm = {
  name: '',
  email: '',
  registrationNumber: '',
  foodPreference: '',
};

const REGISTRATION_STORAGE_KEY = 'ignite-formspree-registrations';

function getSavedRegistrations() {
  try {
    const saved = JSON.parse(localStorage.getItem(REGISTRATION_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function rememberRegistration(email, registrationNumber, registrationId) {
  try {
    const saved = getSavedRegistrations();
    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify([...saved, { email, registrationNumber, registrationId }]));
  } catch {
    // Some browsers block localStorage; Formspree submission still works.
  }
}

export default function RegistrationModal({ isOpen, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !sending) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, sending]);

  const submit = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@(centurionuniv\.edu\.in|cutm\.ac\.in)$/.test(email)) {
      setStatus({ type: 'error', text: 'Use your @centurionuniv.edu.in or @cutm.ac.in email address.' });
      return;
    }
    const registrationNumber = form.registrationNumber.trim().toLowerCase();
    const alreadyRegistered = getSavedRegistrations().some((entry) => entry.email === email || entry.registrationNumber === registrationNumber);
    if (alreadyRegistered) {
      setStatus({ type: 'error', text: 'This email address or registration number has already been used for IGNITE registration.' });
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const registrationId = typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `IGNITE-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const registrationDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const submissionData = {
        _date: registrationDate,
        name: form.name.trim(),
        email,
        registrationNumber,
        foodPreference: form.foodPreference,
        registrationId,
        checkedIn: false,
        checkInTime: '',
        _subject: 'IGNITE Registration',
      };
      const response = await fetch(FORM_ENDPOINTS.registration, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      if (!response.ok) throw new Error('Registration form submission failed');

      const sheetsResponse = await fetch(FORM_ENDPOINTS.googleSheets, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(submissionData),
      });
      const sheetsText = await sheetsResponse.text();
      let sheetsResult = null;
      try {
        sheetsResult = sheetsText ? JSON.parse(sheetsText) : null;
      } catch {
        // Apps Script may return a plain-text response.
      }
      const sheetsMessage = typeof sheetsResult?.message === 'string'
        ? sheetsResult.message
        : sheetsText;
      const duplicateResponse = /duplicate|already registered|already exists|already used/i.test(sheetsMessage || '')
        || sheetsResult?.duplicate === true;
      if (!sheetsResponse.ok || sheetsResult?.success === false || sheetsResult?.ok === false || duplicateResponse) {
        throw new Error(duplicateResponse ? 'This email address or registration number has already been registered.' : 'Google Sheets registration could not be saved.');
      }

      rememberRegistration(email, registrationNumber, registrationId);
      setForm(emptyForm);
      setStatus({ type: 'success', text: `Registration submitted successfully! Your Registration ID is ${registrationId}` });
    } catch (error) {
      setStatus({ type: 'error', text: error.message || 'Unable to submit right now. Please check the Formspree and Google Sheets connections.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="registration-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(event) => { if (event.target === event.currentTarget && !sending) onClose(); }}
        >
          <motion.div
            className="registration-modal glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-title"
            initial={{ opacity: 0, scale: 0.92, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
          >
            <button className="modal-close" type="button" onClick={onClose} disabled={sending} aria-label="Close registration form">×</button>
            <span className="eyebrow">IGNITE REGISTRATION</span>
            <h2 id="registration-title">Register Now</h2>
            <p className="registration-intro">Reserve your place for the IGNITE freshers celebration on 9 October.</p>
            <form action={FORM_ENDPOINTS.registration} method="POST" className="registration-form" onSubmit={submit}>
              <label htmlFor="registration-name">Full Name</label>
              <input id="registration-name" className="field" type="text" name="name" placeholder="Enter your full name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />

              <label htmlFor="registration-email">Email</label>
              <input id="registration-email" className="field" type="email" name="email" placeholder="name@cutm.ac.in or name@centurionuniv.edu.in" pattern="^[^\s@]+@(centurionuniv\.edu\.in|cutm\.ac\.in)$" title="Use an @centurionuniv.edu.in or @cutm.ac.in email address" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />

              <label htmlFor="registration-number">Registration Number</label>
              <input id="registration-number" className="field" type="text" name="registrationNumber" placeholder="Enter registration number" required value={form.registrationNumber} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} />

              <fieldset className="food-preference-field">
                <legend>Food Preference</legend>
                <label className="radio-option"><input type="radio" name="foodPreference" value="Veg" required checked={form.foodPreference === 'Veg'} onChange={(event) => setForm({ ...form, foodPreference: event.target.value })} /> Veg</label>
                <label className="radio-option"><input type="radio" name="foodPreference" value="Non-Veg" checked={form.foodPreference === 'Non-Veg'} onChange={(event) => setForm({ ...form, foodPreference: event.target.value })} /> Non-Veg</label>
              </fieldset>

              <button className="btn-primary btn-pill form-submit" type="submit" disabled={sending}>{sending ? 'Submitting... ⏳' : 'Register Now'}</button>
              {status && <div className={`form-status ${status.type}`} role="status">{status.text}</div>}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
