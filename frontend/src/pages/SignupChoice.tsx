import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChefHat, Store, ArrowRight } from 'lucide-react';

const SignupChoice: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[450px] animate-in fade-in duration-500 mx-auto">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-10 h-10 bg-surface border border-subtle flex items-center justify-center rounded-md mb-6">
          <div className="w-4 h-4 rounded-full border-[1.5px] border-active"></div>
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight">Create Workspace</h1>
        <p className="text-[14px] text-muted mt-2">Select your deployment context.</p>
      </div>
 
      <div className="space-y-4">
        <button 
          className="w-full surface p-5 text-left border border-subtle hover:border-active transition-colors group flex items-start gap-4"
          onClick={() => navigate('/signup/owner')}
        >
          <div className="w-10 h-10 rounded border border-subtle bg-main flex items-center justify-center text-muted group-hover:text-main shrink-0 transition-colors">
            <Store size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
               <span className="font-semibold text-[14px] text-main">Executive / Owner</span>
               <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[12px] text-muted leading-relaxed">System initiation, billing control, and global menu management.</p>
          </div>
        </button>
 
        <button 
          className="w-full surface p-5 text-left border border-subtle hover:border-active transition-colors group flex items-start gap-4"
          onClick={() => navigate('/signup/staff')}
        >
          <div className="w-10 h-10 rounded border border-subtle bg-main flex items-center justify-center text-muted group-hover:text-main shrink-0 transition-colors">
            <ChefHat size={18} />
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center justify-between mb-1">
               <span className="font-semibold text-[14px] text-main">Kitchen / Service</span>
               <ArrowRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[12px] text-muted leading-relaxed">Join active deployment as waiter staff or kitchen telemetry.</p>
          </div>
        </button>
      </div>
 
      <div className="text-center mt-8">
        <Link to="/login" className="text-[13px] text-muted hover:text-main transition-colors">
          Authenticate existing account
        </Link>
      </div>
    </div>
  );
};

export default SignupChoice;
