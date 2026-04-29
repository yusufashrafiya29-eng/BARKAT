import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LayoutDashboard, Utensils, Smartphone, Activity, BarChart3, Clock, ChefHat, HeartHandshake, ShieldCheck, Users } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a101d] font-sans text-slate-300 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      <PublicNavbar />

      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
        {/* Abstract Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        <div className="max-w-5xl mx-auto z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black text-white tracking-tight leading-[1.1] mb-6">
            All-In-One Software<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400">Powering SME Growth</span><br />
            At Every Step
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Eliminate operational chaos. From QR ordering to intelligent kitchen displays and real-time analytics, MyRestro scales with your vision.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-1">
              Start Free Trial
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>

          {/* Device Mockups (Laptop + Mobile) */}
          <div className="relative w-full max-w-6xl mx-auto mt-10">
            {/* Laptop Frame */}
            <div className="relative z-10 mx-auto w-[90%] md:w-[80%] rounded-t-2xl md:rounded-t-[2rem] border-[8px] md:border-[12px] border-slate-800 bg-slate-900 shadow-2xl shadow-indigo-500/20 overflow-hidden aspect-[16/10]">
              <img src="/images/owner_analytics.png" alt="Owner Dashboard" className="w-full h-full object-cover object-top" />
            </div>
            {/* Laptop Base */}
            <div className="relative z-10 mx-auto w-[95%] md:w-[85%] h-4 md:h-6 bg-slate-700 rounded-b-xl shadow-2xl"></div>

            {/* Mobile Frame */}
            <div className="absolute -bottom-10 md:-bottom-16 right-[5%] md:right-[15%] z-20 w-[120px] md:w-[220px] rounded-[1.5rem] md:rounded-[2.5rem] border-[6px] md:border-[10px] border-slate-800 bg-white shadow-2xl overflow-hidden aspect-[9/19]">
              <img src="/images/customer_menu.jpg" alt="Customer Menu" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUSTED BY */}
      <section className="py-10 border-y border-slate-800/50 bg-[#0d1424]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-8">Trusted by 5,000+ businesses globally</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Abstract placeholders for logos */}
            <div className="flex items-center gap-2 font-black text-xl text-white"><Utensils size={24}/> DineFlow</div>
            <div className="flex items-center gap-2 font-black text-xl text-white"><ChefHat size={24}/> QuickBite</div>
            <div className="flex items-center gap-2 font-black text-xl text-white"><LayoutDashboard size={24}/> TableTop</div>
            <div className="flex items-center gap-2 font-black text-xl text-white"><Activity size={24}/> RestroSync</div>
            <div className="flex items-center gap-2 font-black text-xl text-white"><Smartphone size={24}/> ScanOrder</div>
          </div>
        </div>
      </section>

      {/* 3. VALUE PROPS */}
      <section className="py-24 bg-[#0a101d] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-black tracking-widest uppercase mb-4">
              Why MyRestro
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Simplicity meets excellence<br/>our products excel in every aspect
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 hover:border-indigo-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <Activity size={28} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Continuous Innovation</h3>
              <p className="text-slate-400 leading-relaxed text-[15px]">We push bi-weekly updates based on user feedback, ensuring your restaurant always runs on cutting-edge technology.</p>
            </div>
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 hover:border-violet-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6">
                <HeartHandshake size={28} className="text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Extreme Simplicity</h3>
              <p className="text-slate-400 leading-relaxed text-[15px]">No training required. Our interfaces are designed so intuitively that new staff can operate the POS within 5 minutes.</p>
            </div>
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <ShieldCheck size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">24/7 Support</h3>
              <p className="text-slate-400 leading-relaxed text-[15px]">Hospitality never sleeps, and neither do we. Our dedicated support team is available around the clock to assist you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE ECOSYSTEM (BENTO BOX) */}
      <section className="py-32 bg-slate-50 text-slate-900 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              Our ecosystem — empowering SMEs<br/>through integrated solutions
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
              From the moment a customer scans the menu to the final CA report generation, MyRestro connects every dot in your restaurant's workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">
            
            {/* ITEM 1: Waiter App (Large) */}
            <div className="lg:col-span-2 bg-[#f0fdf4] rounded-[2rem] border border-emerald-100 overflow-hidden relative group">
              <div className="p-8 md:p-10 relative z-20 w-full md:w-[55%] pointer-events-none">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-sm"><Smartphone size={24}/></div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">Service Terminal (POS)</h3>
                <p className="text-emerald-800/70 font-medium leading-relaxed text-[15px] md:text-lg">Empower your waiters to take orders, add chef notes, and process checkouts instantly from any device. Fully synced with the kitchen.</p>
              </div>
              <div className="absolute right-0 bottom-0 w-[85%] md:w-[50%] h-[60%] md:h-[85%] rounded-tl-2xl shadow-2xl border-t-8 border-l-8 border-white overflow-hidden transition-transform duration-500 group-hover:-translate-x-3 group-hover:-translate-y-3 z-10 bg-slate-50">
                <img src="/images/waiter_order.png" alt="Waiter Order App" className="w-full h-full object-cover object-left-top" />
              </div>
            </div>

            {/* ITEM 2: QR Menu */}
            <div className="bg-[#fffbeb] rounded-[2rem] border border-amber-100 overflow-hidden relative group flex flex-col">
              <div className="p-8 pb-0 relative z-20 pointer-events-none">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6 shadow-sm"><Smartphone size={24}/></div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Live QR Menu</h3>
                <p className="text-amber-800/70 font-medium leading-relaxed">Customers scan, browse beautiful digital menus, and order directly.</p>
              </div>
              <div className="mt-auto relative z-10 w-full h-[180px] flex justify-center overflow-hidden">
                <div className="w-[140px] h-[300px] mt-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-[6px] border-white overflow-hidden transition-transform duration-500 group-hover:-translate-y-4 bg-white">
                  <img src="/images/customer_menu.jpg" alt="QR Menu" className="w-full h-full object-cover object-top" />
                </div>
              </div>
            </div>

            {/* ITEM 3: KDS */}
            <div className="bg-[#f5f3ff] rounded-[2rem] border border-violet-100 overflow-hidden relative group flex flex-col">
               <div className="p-8 pb-0 relative z-20 pointer-events-none">
                <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-6 shadow-sm"><ChefHat size={24}/></div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Kitchen Display</h3>
                <p className="text-violet-800/70 font-medium leading-relaxed">No more paper tickets. Real-time syncing from table to kitchen.</p>
              </div>
              <div className="mt-auto relative z-10 w-full h-[160px] pl-8">
                <div className="w-[150%] h-[150%] rounded-tl-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t-[6px] border-l-[6px] border-white overflow-hidden transition-transform duration-500 group-hover:-translate-y-2 group-hover:-translate-x-2 bg-slate-900">
                  <img src="/images/kitchen_kds.png" alt="Kitchen Display System" className="w-full h-full object-cover object-left-top" />
                </div>
              </div>
            </div>

            {/* ITEM 4: Owner Analytics (Large) */}
            <div className="lg:col-span-2 bg-[#eff6ff] rounded-[2rem] border border-blue-100 overflow-hidden relative group">
               <div className="p-8 md:p-10 relative z-20 w-full md:w-[55%] pointer-events-none">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-sm"><BarChart3 size={24}/></div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">Executive Portal</h3>
                <p className="text-blue-800/70 font-medium leading-relaxed text-[15px] md:text-lg">Your entire business at a glance. Track live revenue, monitor active tables, and generate advanced GST & CA reports with one click.</p>
              </div>
              <div className="absolute right-0 bottom-0 w-[85%] md:w-[55%] h-[60%] md:h-[85%] rounded-tl-2xl shadow-2xl border-t-8 border-l-8 border-white overflow-hidden transition-transform duration-500 group-hover:-translate-x-3 group-hover:-translate-y-3 z-10 bg-slate-50">
                <img src="/images/reports.png" alt="Advanced Reports" className="w-full h-full object-cover object-left-top" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4.5. MORE FEATURES GRID */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Plus everything else you need to run a successful restaurant</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { title: 'Cash Register & Shifts' },
              { title: 'Staff Roster & Payroll' },
              { title: 'Inventory Tracking' },
              { title: 'Table Reservations' },
              { title: 'Recipe Management' },
              { title: 'GST Billing & Returns' },
              { title: 'Dynamic Floor Plans' },
              { title: 'Waiter Role Security' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:-translate-y-1 transition-all">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-indigo-600"/>
                </div>
                <span className="font-semibold text-slate-700 text-[13px] md:text-sm">{f.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. METRICS STRIP */}
      <section className="py-20 bg-[#0a101d] border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/3">
              <h2 className="text-3xl font-black text-white leading-tight">Amplifying The<br/>Key Metrics<br/>That Matter</h2>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              <div className="text-center md:text-left border-l-2 border-indigo-500/30 pl-6">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0"><Activity className="text-indigo-400"/></div>
                <p className="text-4xl font-black text-white mb-2">10M+</p>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Orders Processed</p>
              </div>
              <div className="text-center md:text-left border-l-2 border-violet-500/30 pl-6">
                <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0"><Users className="text-violet-400"/></div>
                <p className="text-4xl font-black text-white mb-2">5,000+</p>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Happy Partners</p>
              </div>
              <div className="text-center md:text-left border-l-2 border-emerald-500/30 pl-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0"><Clock className="text-emerald-400"/></div>
                <p className="text-4xl font-black text-white mb-2">99.9%</p>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">System Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SOLUTIONS SHOWCASE */}
      <section className="py-32 bg-white text-slate-900 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">What our solutions can do for you</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Visually map your restaurant, track live table statuses, and manage the floor from anywhere.</p>
          </div>
          
          <div className="w-full max-w-5xl mx-auto rounded-3xl shadow-2xl border-8 border-slate-100 overflow-hidden bg-slate-50">
            <img src="/images/floor_plan.png" alt="Floor Plan Management" className="w-full h-auto object-cover" />
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Hear from our clients</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Rahul Sharma', role: 'Owner, The Great Cafe', quote: 'MyRestro completely eliminated our paper tickets. The kitchen syncs instantly with the waiters, saving us hours of miscommunication.' },
              { name: 'Aditi Desai', role: 'Manager, Cloud Kitchen X', quote: 'The analytics portal is a game changer. I can see my exact daily revenue and top-selling items from my phone while at home.' },
              { name: 'Vikram Singh', role: 'Founder, QuickBite QSR', quote: 'Setup took literally 5 minutes. The QR ordering system increased our table turnover rate by 40% in the first week!' }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
                <div className="flex gap-1 mb-6 text-amber-400">
                  {[...Array(5)].map((_, i) => <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed font-medium">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CONTACT FORM */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="bg-[#0a101d] rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
             {/* Abstract Glow */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/30 rounded-full blur-[80px]"></div>

            <div className="text-center mb-12 relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">We'd love to answer your questions</h2>
              <p className="text-indigo-200">Leave your details and our team will get back to you within 24 hours.</p>
            </div>

            <form className="relative z-10 space-y-6" onSubmit={e => { e.preventDefault(); alert('Message sent!'); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">First Name</label>
                  <input type="text" className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Last Name</label>
                  <input type="text" className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Email Address</label>
                <input type="email" className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" />
              </div>
              <button className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg">
                Send Message
              </button>
            </form>
           </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-[#05080f] py-12 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <img src="/logo.png" alt="MyRestro" className="h-10 w-auto" />
          </div>
          <p className="text-sm text-slate-500 font-medium">© {new Date().getFullYear()} MyRestro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
