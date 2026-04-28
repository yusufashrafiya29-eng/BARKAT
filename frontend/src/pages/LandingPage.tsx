import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, QrCode, TrendingUp, Clock, Smartphone, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px]"></div>
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-violet-400/10 blur-[100px]"></div>
          <div className="absolute bottom-0 left-[20%] w-[60%] h-[30%] rounded-full bg-emerald-400/10 blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[13px] font-bold tracking-wide uppercase mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              The Future of Dining is Here
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Streamline your restaurant with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">MyRestro</span>.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto font-medium">
              A premium, all-in-one POS and management system designed to eliminate wait times, optimize kitchen operations, and delight your customers with QR ordering.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-1">
                Start Your Free Trial
                <ArrowRight size={18} className="ml-2" />
              </Link>
              <button onClick={() => {
                const el = document.getElementById('features');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-slate-700 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm transition-all">
                Explore Features
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-slate-500">
              <span className="flex items-center"><CheckCircle2 size={16} className="text-emerald-500 mr-2" /> No credit card required</span>
              <span className="flex items-center"><CheckCircle2 size={16} className="text-emerald-500 mr-2" /> Setup in 5 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Everything you need to run smoothly</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">MyRestro replaces messy paper tickets and outdated POS systems with a sleek, synchronized digital ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                <QrCode size={28} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">QR Menu & Ordering</h3>
              <p className="text-slate-600 leading-relaxed">Customers scan a QR code at their table to view a beautiful digital menu, place orders, and pay instantly via Razorpay or UPI.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
                <ChefHat size={28} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Kitchen Display (KDS)</h3>
              <p className="text-slate-600 leading-relaxed">Orders instantly appear on the Kitchen Display System. Chefs can mark items as preparing and ready, keeping waiters synced in real-time.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                <TrendingUp size={28} className="text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Analytics</h3>
              <p className="text-slate-600 leading-relaxed">Owners get a bird's-eye view of revenue, top-selling items, and staff performance with interactive charts and daily reports.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-6">
                <Clock size={28} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Faster Table Turnover</h3>
              <p className="text-slate-600 leading-relaxed">By digitizing the ordering and checkout process, tables are freed up faster, directly increasing your daily revenue capacity.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 lg:col-span-2">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Smartphone size={28} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Dedicated Waiter App</h3>
                  <p className="text-slate-600 leading-relaxed">Your wait staff get a dedicated interface to manage assigned tables, take manual orders, and receive notifications when food is ready to be served from the kitchen.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 rounded-l-full blur-3xl transform translate-x-1/3"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[12px] font-bold tracking-widest uppercase mb-6">
                Our Story
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Built by restaurateurs, for restaurateurs.</h2>
              <div className="space-y-6 text-slate-300 text-lg leading-relaxed">
                <p>
                  MyRestro was born out of frustration. Our founder, <strong className="text-white">Yusuf Ashrafiya</strong>, noticed that while the world was moving fast, restaurant management was stuck in the past with clunky hardware, confusing interfaces, and high monthly fees.
                </p>
                <p>
                  We built MyRestro to solve these exact problems. Our mission is to democratize high-end restaurant technology. Whether you run a bustling cafe, a fine-dining establishment, or a quick-service food truck, MyRestro scales with you.
                </p>
                <p>
                  By connecting the customer directly to the kitchen and the kitchen directly to the waiter, we eliminate miscommunications, reduce wait times, and drastically improve the dining experience.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative border border-slate-700/50">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 to-slate-800 flex items-center justify-center p-12 text-center">
                   <div>
                     <h3 className="text-4xl font-black text-white mb-4">MyRestro</h3>
                     <p className="text-indigo-200 font-medium text-xl">Transforming Hospitality</p>
                   </div>
                </div>
              </div>
              {/* Floating Stat Card */}
              <div className="absolute -bottom-8 -left-8 bg-white text-slate-900 p-6 rounded-2xl shadow-xl shadow-black/20 border border-slate-100 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <TrendingUp size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-black">40%</p>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Faster Service</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT US SECTION */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Get in touch</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Have questions about MyRestro? Want a custom enterprise plan? We'd love to hear from you.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase">Call Us</p>
                      <a href="tel:+919979114665" className="text-lg font-bold text-slate-900 hover:text-indigo-600">+91 9979114665</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase">Email Us</p>
                      <a href="mailto:hello@dineflow.com" className="text-lg font-bold text-slate-900 hover:text-indigo-600">hello@dineflow.com</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase">Headquarters</p>
                      <p className="text-base font-medium text-slate-900">Gujarat, India</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-200">
                  <p className="text-sm font-semibold text-slate-500 uppercase mb-2">Founder</p>
                  <p className="text-lg font-bold text-slate-900">Yusuf Ashrafiya</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20" onSubmit={(e) => { e.preventDefault(); alert('Thanks for reaching out! We will contact you soon.'); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all" placeholder="John" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all" placeholder="Doe" required />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all" placeholder="john@example.com" required />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Restaurant Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all" placeholder="The Great Cafe" />
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                  <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all resize-none" placeholder="How can we help you?" required></textarea>
                </div>

                <button type="submit" className="w-full py-4 px-6 rounded-xl text-white font-bold text-lg bg-slate-900 hover:bg-indigo-600 transition-colors shadow-lg">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="text-xl font-bold text-white">MyRestro</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} MyRestro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
