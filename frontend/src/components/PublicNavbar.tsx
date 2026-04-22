import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Navbar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img
              src="/dineflow-logo.png"
              alt="Dine Flow"
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('features')} className="text-[14px] font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</button>
            <button onClick={() => scrollToSection('about')} className="text-[14px] font-medium text-slate-600 hover:text-indigo-600 transition-colors">About Us</button>
            <button onClick={() => scrollToSection('contact')} className="text-[14px] font-medium text-slate-600 hover:text-indigo-600 transition-colors">Contact</button>
            
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-slate-200">
              <Link to="/login" className="text-[14px] font-medium text-slate-600 hover:text-indigo-600 transition-colors">Sign In</Link>
              <Link to="/signup" className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[14px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5">
                Get Started
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-xl absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border-b border-slate-100">Features</button>
            <button onClick={() => scrollToSection('about')} className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border-b border-slate-100">About Us</button>
            <button onClick={() => scrollToSection('contact')} className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Contact</button>
            
            <div className="pt-4 flex flex-col space-y-3 px-3">
              <Link to="/login" className="w-full flex justify-center items-center px-4 py-3 border border-slate-300 rounded-lg text-base font-medium text-slate-700 bg-white hover:bg-slate-50">
                Sign In
              </Link>
              <Link to="/signup" className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
