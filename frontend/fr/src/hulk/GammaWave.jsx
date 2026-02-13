import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateHulkLogicStage, verifyHulkOsint } from '../api/client';
import './GammaWave.css';

const GammaWave = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [stage, setStage] = useState(1); // Track decryption stages
    const [unlockedClues, setUnlockedClues] = useState([]);

  // Final submission state
  const [finalMode, setFinalMode] = useState(false);
  const [osintValue, setOsintValue] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagResult, setFlagResult] = useState(null); // { success, message }
  const [backendQuestion] = useState('');
  const [osintOk, setOsintOk] = useState(() => {
    try { return sessionStorage.getItem('gamma_osint_ok') === '1'; } catch { return false; }
  });

  // Hulk base flag is now only used at final submission in Challenges.
  const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:5000/api';
  const APP_BASE = import.meta.env?.BASE_URL || '/';
  const storedToken = (() => {
    try {
      const raw = localStorage.getItem('nexus_auth');
      if (!raw) return null;
      return JSON.parse(raw)?.token || null;
    } catch { return null; }
  })();

  // ====================================
  // STAGE 1
  // ====================================
  const asciiArt = `
    ╔═══════════════════════════════════════════════════════════╗
    ║          GAMMA WAVE ANALYSIS - CONTAINMENT BREACH         ║
    ╠═══════════════════════════════════════════════════════════╣
    ║                                                           ║
    ║    ░░░▒▒▒▓▓▓███████▓▓▓▒▒▒░░░                             ║
    ║  ░░▒▒▓▓████████████████████▓▓▒▒░░                        ║
    ║ ░▒▓███████████████████████████▓▒░   01001000             ║
    ║░▒▓██████████████████████████████▓▒░                      ║
    ║▒▓████████████████████████████████▓▒  01010101            ║
    ║▓███████████████████████████████████▓                     ║
    ║████████████████████████████████████  01001100            ║
    ║▓███████████████████████████████████▓                     ║
    ║▒▓████████████████████████████████▓▒  01001011            ║
    ║░▒▓██████████████████████████████▓▒░                      ║
    ║ ░▒▓███████████████████████████▓▒░                        ║
    ║  ░░▒▒▓▓████████████████████▓▓▒▒░░                        ║
    ║    ░░░▒▒▒▓▓▓███████▓▓▓▒▒▒░░░                             ║
    ║                                                           ║
    ║         [RADIATION SIGNATURE DETECTED]                   ║
    ║              Decryption Required...                       ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `;

  // ====================================
  // STAGE 2
  // ====================================
  const stage2Cipher = `
    ╔═══════════════════════════════════════════════════════════╗
    ║           SECONDARY ENCRYPTION LAYER DETECTED             ║
    ╠═══════════════════════════════════════════════════════════╣
    ║                                                           ║
    ║   Dr. Banner's Log Entry #247:                           ║
    ║   "The transformation protocol requires a catalyst..."    ║
    ║                                                           ║
      ║   Encrypted Message:                                     ║
    ║   ┌─────────────────────────────────────────────────┐   ║
    ║   │  TNZZN_FZNFU                                    │   ║
    ║   └─────────────────────────────────────────────────┘   ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `;

  // ====================================
  // STAGE 3
  // ====================================
  const stage3Puzzle = `
    ╔═══════════════════════════════════════════════════════════╗
    ║              GAMMA TRANSFORMATION CIPHER                  ║
    ╠═══════════════════════════════════════════════════════════╣
    ║                                                           ║
    ║   Substitution Key:                                       ║
    ║   ┌────────────────────────────────────────────┐         ║
    ║   │  ANGER    → A                              │         ║
    ║   │  EMERALD  → B                              │         ║
    ║   │  JADE     → C                              │         ║
    ║   │  FOREST   → D                              │         ║
    ║   │  LIME     → E                              │         ║
    ║   │  MINT     → F                              │         ║
    ║   └────────────────────────────────────────────┘         ║
    ║                                                           ║
    ║   ┌────────────────────────────────────────────┐         ║
    ║   │  BREAK    → 1                              │         ║
    ║   │  CRUSH    → 2                              │         ║
    ║   │  DESTROY  → 3                              │         ║
    ║   │  POUND    → 4                              │         ║
    ║   │  SMASH    → 5                              │         ║
    ║   │  WRECK    → 6                              │         ║
    ║   └────────────────────────────────────────────┘         ║
    ║                                                           ║
    ║   Encrypted Sequence:                                    ║
    ║   ┌────────────────────────────────────────────┐         ║
    ║   │  B_5                                       │         ║
    ║   └────────────────────────────────────────────┘         ║
      ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `;

  // ====================================
  // STAGE 4
  // ====================================
  const stage4Hex = `
    ╔═══════════════════════════════════════════════════════════╗
      ║                  FINAL SECURITY LAYER                     ║
    ╠═══════════════════════════════════════════════════════════╣
    ║                                                           ║
    ║   ┌─────────────────────────────────────────────────┐   ║
    ║   │  4A 41 44 45 5F 43 52 55 53 48              │   ║
    ║   └─────────────────────────────────────────────────┘   ║
      ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();

    try {
      const res = await validateHulkLogicStage(stage, trimmedInput, user?.token);
      if (!res.ok) {
        if (res.status === 401) {
          logout?.();
          navigate('/login');
          return;
        }
        setShowError(true);
        setErrorMessage(res.error || res.data?.message || 'Incorrect. Try again.');
        setAttempts(prev => prev + 1);
      } else {
        // Advance local stage state on success
        if (stage === 1) {
          setStage(2);
          setUnlockedClues(prev => [...prev, 'stage1']);
        } else if (stage === 2) {
          setStage(3);
          setUnlockedClues(prev => [...prev, 'stage2']);
        } else if (stage === 3) {
          setStage(4);
          setUnlockedClues(prev => [...prev, 'stage3']);
        } else if (stage === 4) {
          setFinalMode(true);
        }
        setShowError(false);
      }
    } catch (err) {
      setShowError(true);
      setErrorMessage('Validation failed. Try again.');
      setAttempts(prev => prev + 1);
    }

    setInputValue('');
  };

  const getCurrentStageContent = () => {
    switch(stage) {
      case 1:
        return {
          title: 'STAGE 1',
          content: asciiArt
        };
      case 2:
        return {
          title: 'STAGE 2',
          content: stage2Cipher
        };
      case 3:
        return {
          title: 'STAGE 3',
          content: stage3Puzzle
        };
      case 4:
        return {
          title: 'STAGE 4',
          content: stage4Hex
        };
      default:
        return {
          title: 'UNKNOWN STAGE',
          content: ''
        };
    }
  };

  const currentStage = getCurrentStageContent();

  // Backend integrations
  const onVerifyToken = async (e) => {
    e.preventDefault();
    if (!isLoggedIn || !user?.token) {
      setFlagResult({ success: false, message: 'Please log in to verify.' });
      return;
    }
    const token = osintValue.trim();
    if (!token) {
      setFlagResult({ success: false, message: 'Enter a forensics token first.' });
      return;
    }
    setFlagSubmitting(true);
    setFlagResult(null);
    const res = await verifyHulkOsint(token, user.token);
    setFlagSubmitting(false);
    if (!res.ok) {
      if (res.status === 401) {
        setFlagResult({ success: false, message: 'Session expired. Please log in again.' });
        logout?.();
        navigate('/login');
        return;
      }
      setFlagResult({ success: false, message: res.error || res.data?.message || 'Verification failed.' });
      return;
    }
    setFlagResult({ success: true, message: res.data?.message || 'Forensics token accepted.' });
    try {
      sessionStorage.setItem('gamma_osint_ok', '1');
    } catch {}
    setOsintOk(true);
  };

  const onSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!isLoggedIn || !user?.token) {
      setAnswerResult({ success: false, message: 'Please log in to submit.' });
      return;
    }
    if (!answerValue.trim()) {
      setAnswerResult({ success: false, message: 'Answer cannot be empty.' });
      return;
    }
    const av = (avengerKey || 'hulk').toLowerCase();
    setAnswerSubmitting(true);
    setAnswerResult(null);
    const res = await submitAnswerApi(av, answerValue.trim(), user.token);
    setAnswerSubmitting(false);
    if (!res.ok) {
      if (res.status === 401) {
        setAnswerResult({ success: false, message: 'Session expired. Please log in again.' });
        logout?.();
        navigate('/login');
        return;
      }
      setAnswerResult({ success: false, message: res.error || 'Submission failed' });
      return;
    }
    setAnswerResult({ success: true, message: res.data?.message || 'Answer accepted.' });
  };

  return (
    <div className="gamma-wave-container">
      {/* Animated background */}
      <div className="wave-animation"></div>
      <div className="radiation-overlay"></div>

      {/* Header */}
      <div className="gamma-header">
        <h1 className="pulse-text">⚡ GAMMA WAVE ANALYZER ⚡</h1>
        <p className="system-status">DECRYPTION STAGE {stage}/4</p>
      </div>

      {/* Progress Indicator */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(stage / 4) * 100}%` }}
          ></div>
        </div>
        <div className="progress-stages">
          <div className={`progress-stage ${stage >= 1 ? 'active' : ''} ${unlockedClues.includes('stage1') ? 'completed' : ''}`}>
            Stage 1
          </div>
          <div className={`progress-stage ${stage >= 2 ? 'active' : ''} ${unlockedClues.includes('stage2') ? 'completed' : ''}`}>
            Stage 2
          </div>
          <div className={`progress-stage ${stage >= 3 ? 'active' : ''} ${unlockedClues.includes('stage3') ? 'completed' : ''}`}>
            Stage 3
          </div>
          <div className={`progress-stage ${stage >= 4 ? 'active' : ''}`}>
            Stage 4
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-wrapper">
        {/* Stage Display */}
        <div className="ascii-container">
          <h3 className="stage-title">{currentStage.title}</h3>
          <pre className="ascii-art">{currentStage.content}</pre>
          <div className="scan-line"></div>
        </div>

        {/* Analysis Section */}
        <div className="analysis-section">
          {/* Current Stage Info */}
          <div className="info-panel">
            <h3>🔬 CURRENT CHALLENGE</h3>
            <p className="analysis-text">Solve this stage to proceed.</p>
            <div className="data-points">
              <div className="data-item">
                <span className="label">Stage:</span>
                <span className="value">{stage} of 4</span>
              </div>
              <div className="data-item">
                <span className="label">Attempts:</span>
                <span className="value">{attempts}</span>
              </div>
              <div className="data-item">
                <span className="label">Progress:</span>
                <span className="value">{Math.round((stage / 4) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="decode-form">
            <label htmlFor="gamma-input" className="form-label">
              ENTER DECODED VALUE:
            </label>
            <div className="input-group">
              <input
                id="gamma-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Stage ${stage} answer...`}
                className="gamma-input"
                autoComplete="off"
              />
              <button type="submit" className="decode-button">
                DECRYPT
              </button>
            </div>
          </form>

          {/* Error Message */}
          {showError && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <p className="error-text">{errorMessage}</p>
            </div>
          )}

          {/* Hints and unlocked clue displays removed to avoid spoilers */}
        </div>
      </div>

      {/* Final Submission Flow: OSINT-only gateway to Advanced CTF */}
      {finalMode && (
        <div className="final-flow">
          <div className="final-panel">
            <h3>Final Submission</h3>
            <form onSubmit={onVerifyToken} className="decode-form">
              <label htmlFor="osint-input" className="form-label">Forensics Token</label>
              <div className="input-group">
                <input
                  id="osint-input"
                  type="text"
                  value={osintValue}
                  onChange={(e) => setOsintValue(e.target.value)}
                  placeholder="Enter OSINT code"
                  className="gamma-input"
                  autoComplete="off"
                  disabled={flagSubmitting}
                />
                <button className="decode-button" type="submit" disabled={flagSubmitting}>
                  {flagSubmitting ? 'Verifying...' : 'Verify Token'}
                </button>
              </div>
              <div className="mt-2 text-xs opacity-70">
                <a href={`${APP_BASE}robots.txt`} target="_blank" rel="noreferrer" className="hover:underline">Open robots.txt</a>
                <span className="mx-2">•</span>
                <a href={`${APP_BASE}gamma-logs/index.html`} target="_blank" rel="noreferrer" className="hover:underline">Open gamma-logs</a>
              </div>
              {flagResult && (
                <div className={`api-message ${flagResult.success ? 'success' : 'error'}`}>
                  {flagResult.message}
                </div>
              )}
              {osintOk && (
                <div className="mt-3">
                  <button type="button" className="decode-button" onClick={() => navigate('/hulk/advanced')}>
                    🔐 Proceed to Advanced CTF
                  </button>
                  <div className="text-xs opacity-70 mt-1">Forensics token verified; advanced path is unlocked.</div>
                </div>
              )}
              <div className="dev-hint text-xs opacity-60 mt-2">
                <div>Auth token: {Boolean(user?.token || storedToken) ? 'present' : 'missing'}</div>
                <div>API: {API_BASE}</div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="gamma-footer">
        <div className="stats">
          <span>Stage: {stage}/4</span>
          <span>Attempts: {attempts}</span>
        </div>
        <button 
          className="back-btn"
          onClick={() => navigate('/hulk')}
        >
          ← Back to Chamber
        </button>
      </div>
    </div>
  );
};

export default GammaWave;