import { type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';
import { useOwnerStore } from '../../store/ownerStore';

export default function SettingsTab() {
  const { upiId, razorpayKeys, fetchData, setFormLoading, formLoading } = useOwnerStore();

  const handleSaveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await ownerApi.updateProfile(formData);
      toast.success("Profile updated");
      if (res.name) localStorage.setItem('restaurantName', res.name);
      if (res.logo_url) {
        localStorage.setItem('restaurantLogo', res.logo_url);
      }
      if (formData.get('gstin')) localStorage.setItem('restaurantGstin', formData.get('gstin') as string);
      if (formData.get('fssai')) localStorage.setItem('restaurantFssai', formData.get('fssai') as string);
      if (formData.get('advance_booking_fee')) localStorage.setItem('advanceBookingFee', formData.get('advance_booking_fee') as string);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const current_password = formData.get('current_password') as string;
    const new_password = formData.get('new_password') as string;
    
    try {
      await ownerApi.changePassword({ current_password, new_password });
      toast.success("Password changed successfully");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveUpi = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const updatedUpi = formData.get('upi_id') as string;

    try {
      await ownerApi.updateUpiId(updatedUpi);
      toast.success("UPI Configuration Saved");
      fetchData();
    } catch {
      toast.error("Failed to save UPI settings");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveRazorpay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const keyId = formData.get('razorpay_key_id') as string;
    const keySecret = formData.get('razorpay_key_secret') as string;

    try {
      await ownerApi.updateRazorpayKeys({ razorpay_key_id: keyId, razorpay_key_secret: keySecret });
      toast.success("Razorpay Configuration Saved");
      fetchData();
    } catch {
      toast.error("Failed to save Razorpay settings");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
    
      {/* PROFILE SETTINGS */}
      <div className="surface p-6 mb-6">
        <h3 className="text-[15px] font-medium mb-1">Restaurant Profile</h3>
        <p className="text-[13px] text-muted mb-6">Update your restaurant's brand identity.</p>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-main">Restaurant Name</label>
            <input
              name="name"
              defaultValue={localStorage.getItem('restaurantName') || ''}
              className="form-input"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-main">Restaurant Logo (Optional)</label>
            <input
              name="logo"
              type="file"
              accept="image/*"
              className="form-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-main">Advance Booking Fee (₹)</label>
            <input
              name="advance_booking_fee"
              type="number"
              defaultValue={localStorage.getItem('advanceBookingFee') || '100'}
              className="form-input"
              min="0"
            />
            <p className="text-[10px] text-muted">Amount charged to customers to secure a table reservation.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-main">GSTIN Number</label>
              <input
                name="gstin"
                placeholder="Ex: 22AAAAA0000A1Z5"
                defaultValue={localStorage.getItem('restaurantGstin') || ''}
                className="form-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-main">FSSAI Number</label>
              <input
                name="fssai"
                placeholder="14-digit FSSAI Number"
                defaultValue={localStorage.getItem('restaurantFssai') || ''}
                className="form-input"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-subtle">
            <button disabled={formLoading} className="btn w-full justify-center">
              {formLoading ? <Loader2 size={16} className="animate-spin" /> : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* UPI CONFIGURATION */}
      <div className="surface p-6 mb-6">
        <h3 className="text-[15px] font-medium mb-1">Payment Configuration (UPI)</h3>
        <p className="text-[13px] text-muted mb-6">Set your UPI ID to receive payments directly via QR Code.</p>

        <form onSubmit={handleSaveUpi} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-main">Merchant UPI ID</label>
            <input
              name="upi_id"
              defaultValue={upiId}
              placeholder="e.g. yourname@ybl"
              className="form-input"
            />
          </div>
          <div className="pt-2 border-t border-subtle">
            <button disabled={formLoading} className="btn w-full justify-center">
              {formLoading ? <Loader2 size={16} className="animate-spin" /> : "Save Payment Settings"}
            </button>
          </div>
        </form>
      </div>

      {/* RAZORPAY CONFIGURATION */}
      <div className="surface p-6 mb-6">
        <h3 className="text-[15px] font-medium mb-1">Razorpay Configuration</h3>
        <p className="text-[13px] text-muted mb-6">Set your Razorpay API keys to receive payments securely online.</p>

        <form onSubmit={handleSaveRazorpay} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-main">Razorpay Key ID</label>
            <input
              name="razorpay_key_id"
              defaultValue={razorpayKeys.razorpay_key_id}
              placeholder="rzp_live_xxx..."
              className="form-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-main">Razorpay Key Secret</label>
            <input
              name="razorpay_key_secret"
              type="password"
              defaultValue={razorpayKeys.razorpay_key_secret}
              placeholder="****************"
              className="form-input"
            />
          </div>
          <div className="pt-2 border-t border-subtle">
            <button disabled={formLoading} className="btn w-full justify-center">
              {formLoading ? <Loader2 size={16} className="animate-spin" /> : "Save Razorpay Keys"}
            </button>
          </div>
        </form>
      </div>

      {/* SECURITY SETTINGS */}
      <div className="surface p-6">
        <h3 className="text-[15px] font-medium text-rose-600 mb-1">Security Settings</h3>
        <p className="text-[13px] text-muted mb-6">Update your account password.</p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-main">Current Password</label>
            <input
              name="current_password"
              type="password"
              required
              className="form-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-main">New Password</label>
            <input
              name="new_password"
              type="password"
              required
              className="form-input"
            />
          </div>
          <div className="pt-2 border-t border-subtle">
            <button disabled={formLoading} className="btn-danger w-full justify-center bg-rose-50 text-rose-600 hover:bg-rose-100">
              {formLoading ? <Loader2 size={16} className="animate-spin" /> : "Change Password"}
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
}
