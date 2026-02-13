import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HulkAdvanced.css';
import gammaStegoImg from '../assets/img/gamma_stego.png';
import { useAuth } from '../context/AuthContext';
import { submitAdvancedFlag as submitAdvancedFlagApi } from '../api/client';

const HulkAdvanced = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [pathChoice, setPathChoice] = useState(null); // 'ctf' or 'logic'
  const [ctfStage, setCtfStage] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [discoveredClues, setDiscoveredClues] = useState([]);
  const [jwtToken, setJwtToken] = useState('');
  const [apiResponse, setApiResponse] = useState('');

  // Hidden steganography image (bundled via import to avoid 404 under Vite)
  const stegoImage = gammaStegoImg;

  // Obfuscated JavaScript that reveals API endpoint
  const obfuscatedCode = `
    const _0x4a2b=['aHR0cHM6Ly9hcGkuZ2FtbWEuZGV2','L2dhbW1hLWFuYWx5emU=','YXBpX2tleV9odWxrXzIwMjY='];
    (function(_0x3f8d12,_0x4a2b73){
      const _0x5c1e89=function(_0x2d4a85){
        while(--_0x2d4a85){
          _0x3f8d12['push'](_0x3f8d12['shift']());
        }
      };
      _0x5c1e89(++_0x4a2b73);
    }(_0x4a2b,0x1a3));
    const _0x5c1e=function(_0x3f8d12,_0x4a2b73){
      _0x3f8d12=_0x3f8d12-0x0;
      let _0x5c1e89=_0x4a2b[_0x3f8d12];
      return _0x5c1e89;
    };
    const endpoint=atob(_0x5c1e('0x0'))+atob(_0x5c1e('0x1'));
    const key=atob(_0x5c1e('0x2'));
  `;

  useEffect(() => {
    // Require prior OSINT + flag submission
    try {
      const ok = sessionStorage.getItem('gamma_osint_ok');
      if (ok !== '1') {
        navigate('/gamma_wave');
      }
    } catch {}
    return () => {};
  }, [ctfStage, attempts]);

  const handlePathChoice = (path) => {
    setPathChoice(path);
    if (path === 'logic') {
      // Redirect to existing logic puzzle path
      navigate('/gamma_wave');
    }
  };

  const handleCtfSubmit = async (e) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();

    // ===================================
    // CTF STAGE 1: Steganography
    // ===================================
    if (ctfStage === 1) {
      // Hidden text in image: "gamma_encrypted_xk7m"
      const correctAnswer = 'gamma_encrypted_xk7m';
      
      if (trimmedInput.toLowerCase() === correctAnswer.toLowerCase()) {
        setCtfStage(2);
        setDiscoveredClues(prev => [...prev, 'stego_decoded']);
        setShowError(false);
        setInputValue('');
        return;
      } else {
        setShowError(true);
        setErrorMessage('Incorrect steganography extraction. Use tools like steghide or strings.');
        setAttempts(prev => prev + 1);
      }
    }

    // ===================================
    // CTF STAGE 2: Decrypt Encrypted Text
    // ===================================
    else if (ctfStage === 2) {
      // XOR decryption: "gamma_encrypted_xk7m" XOR "HULK" = "api.gamma.dev/analyze"
      const correctEndpoint = '/api/gamma-analyze';
      
      if (trimmedInput.toLowerCase().includes('gamma-analyze') || 
          trimmedInput.toLowerCase().includes('gamma/analyze')) {
        setCtfStage(3);
        setDiscoveredClues(prev => [...prev, 'endpoint_found']);
        setShowError(false);
        setInputValue('');
        return;
      } else {
        setShowError(true);
        setErrorMessage('Wrong endpoint. Deobfuscate the JS code or decrypt the text.');
        setAttempts(prev => prev + 1);
      }
    }

    // ===================================
    // CTF STAGE 3: JWT Token Generation
    // ===================================
    else if (ctfStage === 3) {
      // Valid JWT format check
      const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
      
      if (jwtPattern.test(trimmedInput)) {
        // Decode and verify JWT
        try {
          const parts = trimmedInput.split('.');
          const payload = JSON.parse(atob(parts[1]));
          
          // Check for admin role and specific user
          if (payload.role === 'admin' && payload.user === 'banner') {
            setJwtToken(trimmedInput);
            setCtfStage(4);
            setDiscoveredClues(prev => [...prev, 'jwt_crafted']);
            setShowError(false);
            setInputValue('');
            return;
          } else {
            setShowError(true);
            setErrorMessage('JWT valid but insufficient privileges. Need role:admin, user:banner');
            setAttempts(prev => prev + 1);
          }
        } catch (err) {
          setShowError(true);
          setErrorMessage('Invalid JWT format. Check header.payload.signature structure.');
          setAttempts(prev => prev + 1);
        }
      } else {
        setShowError(true);
        setErrorMessage('Invalid JWT format. Must be header.payload.signature');
        setAttempts(prev => prev + 1);
      }
    }

    // ===================================
    // CTF STAGE 4: SQL Injection
    // ===================================
    else if (ctfStage === 4) {
      // SQL injection payloads
      const sqlPayloads = [
        "' OR '1'='1",
        "' OR 1=1--",
        "' UNION SELECT flag FROM secrets--",
        "admin'--",
        "' OR 'a'='a"
      ];

      const isSqlInjection = sqlPayloads.some(payload => 
        trimmedInput.includes(payload) || 
        trimmedInput.toLowerCase().includes('union') ||
        trimmedInput.toLowerCase().includes("' or '") ||
        trimmedInput.toLowerCase().includes('1=1')
      );

      if (isSqlInjection) {
        // Simulate SQL injection success; now submit final flag to backend
        const flag = 'FLAG{HULK_GAMMA_MASTER_2026}';
        setApiResponse(flag);
        setDiscoveredClues(prev => [...prev, 'sql_exploited']);
        setShowError(false);

        // Submit advanced flag for points + stone, then redirect to Challenges
        const submitFinal = async () => {
          if (!isLoggedIn || !user?.token) {
            setErrorMessage('Please log in to submit final flag.');
            setShowError(true);
            return;
          }
          const res = await submitAdvancedFlagApi(flag, user.token);
          if (!res.ok) {
            if (res.status === 401) {
              logout?.();
              navigate('/login');
              return;
            }
            setErrorMessage(res.error || 'Final submission failed');
            setShowError(true);
            return;
          }
          navigate('/challenges');
        };
        submitFinal();
        return;
      } else {
        setShowError(true);
        setErrorMessage('Query failed. Try SQL injection techniques.');
        setAttempts(prev => prev + 1);
      }
    }

    setInputValue('');
  };

  const renderCtfStage = () => {
    switch(ctfStage) {
      case 1:
        return (
          <div className="ctf-stage">
            <h3>🔍 STAGE 1: Steganography</h3>
            <div className="challenge-description">
              <p>Dr. Banner encoded secret data within this gamma radiation scan image.</p>
              <p>Extract the hidden message using steganography tools.</p>
            </div>

            <div className="stego-image-container">
              <img 
                src={stegoImage} 
                alt="Gamma Scan"
                className="gamma-scan-image"
                onError={(e) => {
                  // Fallback: create canvas with hidden text
                  e.target.style.display = 'none';
                }}
              />
              <div className="image-metadata">
                <p><strong>File:</strong> hulk-gamma-data.png</p>
                <p><strong>Size:</strong> 2.4 MB</p>
                <p><strong>Type:</strong> PNG Image</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="ctf-stage">
            <h3>🔓 STAGE 2: Decrypt & Deobfuscate</h3>
            <div className="challenge-description">
              <p>You found encrypted text: <code>gamma_encrypted_xk7m</code></p>
              <p>Deobfuscate the JavaScript code below to find the API endpoint.</p>
            </div>

            <div className="code-container">
              <h4>Obfuscated JavaScript:</h4>
              <pre className="obfuscated-code">{obfuscatedCode}</pre>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="ctf-stage">
            <h3>🔑 STAGE 3: JWT Exploitation</h3>
            <div className="challenge-description">
              <p>API endpoint found: <code>/api/gamma-analyze</code></p>
              <p>This endpoint requires JWT authentication with admin privileges.</p>
            </div>

            <div className="jwt-info">
              <h4>JWT Requirements:</h4>
              <div className="jwt-structure">
                <p><strong>Required Payload:</strong></p>
                <pre>{`{
  "user": "banner",
  "role": "admin",
  "exp": ${Math.floor(Date.now() / 1000) + 3600}
}`}</pre>
              </div>
            </div>

          </div>
        );

      case 4:
        return (
          <div className="ctf-stage">
            <h3>💉 STAGE 4: SQL Injection</h3>
            <div className="challenge-description">
              <p>Authenticated successfully! Now accessing the database.</p>
              <p>The gamma analysis API has a vulnerable search parameter.</p>
            </div>

            <div className="sql-scenario">
              <h4>Vulnerable Query:</h4>
              <pre className="vulnerable-code">{`# Backend code (vulnerable)
query = "SELECT * FROM gamma_data WHERE sample_id = '" + user_input + "'"

# Your input is inserted directly into SQL!`}</pre>
            </div>

          </div>
        );

      default:
        return null;
    }
  };

  if (!pathChoice) {
    return (
      <div className="path-selection-container">
        <div className="gamma-header">
          <h1 className="pulse-text">🟢 HULK CHALLENGE PATHS 🟢</h1>
          <p className="subtitle">Choose Your Challenge Route</p>
        </div>

        <div className="path-options">
          <div className="path-card ctf-path" onClick={() => handlePathChoice('ctf')}>
            <div className="path-icon">🔐</div>
            <h2>Advanced CTF Path</h2>
            <div className="difficulty-badge hard">VERY HARD</div>
            <p className="path-description">
              Multi-stage exploitation challenge combining:
            </p>
            <ul className="path-features">
              <li>🖼️ Steganography extraction</li>
              <li>🔓 JavaScript deobfuscation</li>
              <li>🔑 JWT token exploitation</li>
              <li>💉 SQL injection attacks</li>
            </ul>
            <p className="path-reward">Reward: FLAG{'{HULK_GAMMA_MASTER_2026}'}</p>
            <p className="estimated-time">⏱️ Est. Time: 45-90 minutes</p>
          </div>

          <div className="path-card logic-path" onClick={() => handlePathChoice('logic')}>
            <div className="path-icon">🧩</div>
            <h2>Logic Puzzle Path</h2>
            <div className="difficulty-badge hard">HARD</div>
            <p className="path-description">
              Multi-stage logic and cipher challenges:
            </p>
            <ul className="path-features">
              <li>🔢 Binary reversal puzzle</li>
              <li>🎨 Color chemistry riddle</li>
              <li>🧠 Deductive logic grid</li>
              <li>🔍 Pattern recognition</li>
            </ul>
            <p className="path-reward">Reward: Time Stone + Question</p>
            <p className="estimated-time">⏱️ Est. Time: 35-50 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  // CTF Path Interface
  return (
    <div className="hulk-advanced-container">
      <div className="wave-animation"></div>
      <div className="radiation-overlay"></div>

      <div className="gamma-header">
        <h1 className="pulse-text">🔐 CTF PATH - GAMMA EXPLOITATION</h1>
        <p className="system-status">STAGE {ctfStage}/4</p>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(ctfStage / 4) * 100}%` }}
          ></div>
        </div>
        <div className="progress-stages">
          <div className={`progress-stage ${ctfStage >= 1 ? 'active' : ''} ${discoveredClues.includes('stego_decoded') ? 'completed' : ''}`}>
            Stego
          </div>
          <div className={`progress-stage ${ctfStage >= 2 ? 'active' : ''} ${discoveredClues.includes('endpoint_found') ? 'completed' : ''}`}>
            Decrypt
          </div>
          <div className={`progress-stage ${ctfStage >= 3 ? 'active' : ''} ${discoveredClues.includes('jwt_crafted') ? 'completed' : ''}`}>
            JWT
          </div>
          <div className={`progress-stage ${ctfStage >= 4 ? 'active' : ''} ${discoveredClues.includes('sql_exploited') ? 'completed' : ''}`}>
            SQL
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ctf-content">
        {renderCtfStage()}

        {/* Input Form */}
        <form onSubmit={handleCtfSubmit} className="ctf-form">
          <label htmlFor="ctf-input" className="form-label">
            {ctfStage === 1 && 'Enter extracted hidden text:'}
            {ctfStage === 2 && 'Enter decoded API endpoint:'}
            {ctfStage === 3 && 'Enter crafted JWT token:'}
            {ctfStage === 4 && 'Enter SQL injection payload:'}
          </label>
          <div className="input-group">
            <input
              id="ctf-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Your answer..."
              className="ctf-input"
              autoComplete="off"
            />
            <button type="submit" className="submit-button">
              SUBMIT
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

        {/* API Response (Stage 4 success) */}
        {apiResponse && (
          <div className="api-response success">
            <h4>🎉 SQL Injection Successful!</h4>
            <pre className="flag-display">{apiResponse}</pre>
            <p>Redirecting to final submission...</p>
          </div>
        )}

        {/* Discovered Clues */}
        {discoveredClues.length > 0 && (
          <div className="discovered-clues">
            <h4>🔓 Progress:</h4>
            {discoveredClues.includes('stego_decoded') && (
              <div className="clue-item">✅ Steganography: Hidden text extracted</div>
            )}
            {discoveredClues.includes('endpoint_found') && (
              <div className="clue-item">✅ Deobfuscation: API endpoint discovered</div>
            )}
            {discoveredClues.includes('jwt_crafted') && (
              <div className="clue-item">✅ JWT: Admin token crafted</div>
            )}
            {discoveredClues.includes('sql_exploited') && (
              <div className="clue-item">✅ SQL Injection: Database exploited</div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="ctf-footer">
        <div className="stats">
          <span>Stage: {ctfStage}/4</span>
          <span>Attempts: {attempts}</span>
          <span>Path: CTF</span>
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

export default HulkAdvanced;