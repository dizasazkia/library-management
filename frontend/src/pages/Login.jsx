import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { login } from '../api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await login(username, password);
      authLogin(res.data.token);
      navigate('/');
    } catch (err) {
      setError('Kredensial salah');
    }
    setLoading(false);
  };

  return (
    <div className="hero min-h-screen bg-[#CCDDFB]">
      <div className="hero-content flex-col ">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body bg-white rounded-md w-80">
            <h2 className="card-title text-black mb-5">Login</h2>
            {error && <div className="alert alert-error">{error}</div>}
            {loading && <div className="loading loading-spinner"></div>}
            <input
              type="text"
              placeholder="Username"
              className="input input-bordered bg-blue-100 text-gray-700 mb-5"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered bg-blue-100 text-gray-700 mb-5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;