import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { customerApi } from '../api/customer';
import toast from 'react-hot-toast';
import { Calendar, Clock, Users, User, Phone, CheckCircle2, Loader2 } from 'lucide-react';

export default function PublicBooking() {
  const { restaurantId } = useParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reservationData, setReservationData] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      customerApi.getPublicRestaurantInfo(restaurantId)
        .then(data => setRestaurant(data))
        .catch(() => toast.error("Restaurant not found"))
        .finally(() => setInitLoading(false));
    }
  }, [restaurantId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restaurantId) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      customer_name: formData.get('name') as string,
      customer_phone: formData.get('phone') as string,
      reservation_date: formData.get('date') as string,
      reservation_time: formData.get('time') + ":00",
      guest_count: parseInt(formData.get('guests') as string),
    };

    try {
      const res = await customerApi.createPublicReservation(restaurantId, payload);
      setReservationData(res);
      
      // Handle Razorpay if advance is required
      if (res.advance_amount > 0) {
        const payInit = await customerApi.initReservationPayment(res.id);
        
        if (payInit.razorpay_order_id) {
          const options = {
            key: payInit.razorpay_key_id,
            amount: payInit.amount,
            currency: payInit.currency,
            name: "Table Reservation",
            description: "Advance Booking Fee",
            order_id: payInit.razorpay_order_id,
            handler: async (response: any) => {
              try {
                await customerApi.verifyReservationPayment(res.id, {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                toast.success('Payment successful! Booking confirmed.');
                setSuccess(true);
              } catch (err: any) {
                toast.error('Payment verification failed.');
              }
            },
            prefill: {
              name: payload.customer_name,
              contact: payload.customer_phone,
            },
            theme: { color: "#6366f1" }
          };
          
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          // No online payment keys configured on backend, auto confirmed
          setSuccess(true);
        }
      } else {
        // No advance required
        setSuccess(true);
        toast.success("Booking request sent successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to book table");
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-100 p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your table for {reservationData?.guest_count} guests on {reservationData?.reservation_date} has been successfully booked.
          </p>
          {reservationData?.advance_amount > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl text-sm font-medium text-slate-600 mb-8 border border-slate-200">
              Advance Paid: ₹{reservationData.advance_amount}
            </div>
          )}
          <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors">
            Book Another Table
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      {/* Restaurant Header */}
      {restaurant && (
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt={restaurant.name} className="w-24 h-24 rounded-2xl shadow-xl mx-auto mb-4 object-cover border-4 border-white" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl mx-auto mb-4 flex items-center justify-center border-4 border-white">
              <span className="text-3xl font-black text-white">{restaurant.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <h1 className="text-3xl font-black text-slate-800">{restaurant.name}</h1>
          <p className="text-slate-500 font-medium mt-1">Table Reservation</p>
        </div>
      )}

      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl shadow-indigo-100 border border-white overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <h2 className="text-2xl font-black relative z-10">Reserve Your Table</h2>
          <p className="text-indigo-100 mt-2 text-sm font-medium relative z-10">Select your date and time below</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-slate-400" />
              </div>
              <input name="name" required placeholder="Full Name" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-800 placeholder:text-slate-400" />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone size={18} className="text-slate-400" />
              </div>
              <input name="phone" required placeholder="Phone Number" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-800 placeholder:text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-slate-400" />
                </div>
                <input name="date" type="date" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-800" />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Clock size={18} className="text-slate-400" />
                </div>
                <input name="time" type="time" required className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-800" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Users size={18} className="text-slate-400" />
              </div>
              <input name="guests" type="number" min="1" required placeholder="Number of Guests" defaultValue="2" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-slate-800 placeholder:text-slate-400" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] flex justify-center items-center shadow-lg shadow-slate-900/20">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm Booking'}
          </button>
          
          {restaurant?.advance_booking_fee > 0 && (
            <p className="text-center text-xs text-amber-600 bg-amber-50 py-2 rounded-lg font-semibold border border-amber-100">
              ₹{restaurant.advance_booking_fee} advance booking fee required
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
