import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChefHat, Store } from 'lucide-react';

const SignupChoice: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <div className="auth-header">
        <h1 className="text-gradient">Join Us</h1>
        <p>How would you like to register?</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '24px', justifyContent: 'flex-start' }}
          onClick={() => navigate('/signup/owner')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Store size={32} color="var(--primary)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-color)' }}>Restaurant Owner</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Set up a new restaurant and manage staff.</div>
            </div>
          </div>
        </button>

        <button 
          className="btn btn-secondary" 
          style={{ padding: '24px', justifyContent: 'flex-start' }}
          onClick={() => navigate('/signup/staff')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ChefHat size={32} color="var(--secondary)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-color)' }}>Restaurant Staff</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Join an existing restaurant as Kitchen or Waiter.</div>
            </div>
          </div>
        </button>
      </div>

      <div className="auth-footer">
        <p>Already have an account? <Link to="/login">Log in here</Link></p>
      </div>
    </div>
  );
};

export default SignupChoice;
