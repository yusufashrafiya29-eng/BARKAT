import React, { useEffect, useState, useRef } from 'react';
import { getPendingOrders, acceptOrder, rejectOrder } from '../api/aggregator';
import type { AggregatorOrder } from '../api/aggregator';
import { CheckCircle, XCircle, Clock, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export const AggregatorPanel: React.FC = () => {
  const [pendingOrders, setPendingOrders] = useState<AggregatorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('Out of stock');
  const wsRef = useRef<WebSocket | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await getPendingOrders();
      setPendingOrders(data);
    } catch (error) {
      console.error('Failed to fetch aggregator orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const restaurantId = localStorage.getItem('restaurantId');
    
    if (!token || !restaurantId) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host.replace('5173', '8000')}/api/v1/orders/ws/kitchen/${restaurantId}?token=${token}`;
    
    const connectWs = () => {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_AGGREGATOR_ORDER') {
            toast.success(`New ${data.platform} order arrived!`, {
              icon: '🚀',
              duration: 5000,
            });
            audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
            fetchOrders();
          }
        } catch (e) {
          console.error("Error parsing WS message", e);
        }
      };

      wsRef.current.onclose = () => {
        setTimeout(connectWs, 3000);
      };
    };

    connectWs();
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const handleAccept = async (id: string) => {
    setIsAccepting(id);
    try {
      await acceptOrder(id);
      toast.success('Order accepted! Sent to KDS & Auto-Billed.');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to accept order. Are items mapped?');
    } finally {
      setIsAccepting(null);
    }
  };

  const handleReject = async (id: string) => {
    setIsRejecting(true);
    try {
      await rejectOrder(id, rejectReason);
      toast.success('Order rejected.');
      setRejectingId(null);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to reject order.');
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary-500" />
            Aggregator Waiter Panel
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and accept incoming orders from Swiggy & Zomato
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              try {
                const restaurantId = localStorage.getItem('restaurantId');
                if(!restaurantId) {
                  toast.error("Restaurant ID missing");
                  return;
                }
                const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
                const response = await fetch(`${BASE_URL}/aggregators/webhooks/dams`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orders: [
                      {
                        vendor: Math.random() > 0.5 ? 'swiggy' : 'zomato',
                        orderId: `SIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        resId: restaurantId,
                        data: {
                          customer: { name: 'Demo Customer', phone: '9876543210' },
                          order_subtotal: 500,
                          items: [{ name: 'Test Paneer Tikka', quantity: 1, id: 'ITEM-TEST' }]
                        }
                      }
                    ]
                  })
                });
                if(response.ok) {
                  toast.success("Simulated order sent!");
                }
              } catch(e) {
                console.error(e);
              }
            }}
            className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-100 transition-colors"
          >
            + Simulate Order
          </button>
          
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm flex items-center gap-2 border border-gray-100 dark:border-gray-700">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">Listening for orders...</span>
          </div>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-gray-300 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No pending orders</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            When customers place orders on Swiggy or Zomato, they will appear here for you to accept.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pendingOrders.map((order: AggregatorOrder) => (
            <div 
              key={order.id} 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center ${
                order.platform.toLowerCase() === 'zomato' ? 'bg-red-50 dark:bg-red-900/10' : 
                order.platform.toLowerCase() === 'swiggy' ? 'bg-orange-50 dark:bg-orange-900/10' : 
                'bg-gray-50 dark:bg-gray-700'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold px-2 py-1 rounded text-xs tracking-wider uppercase ${
                    order.platform.toLowerCase() === 'zomato' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 
                    order.platform.toLowerCase() === 'swiggy' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 
                    'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {order.platform}
                  </span>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    ID: {order.platform_order_id}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                    <p className="text-sm text-gray-500">{order.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 uppercase tracking-wider block">Total Amount</span>
                    <span className="font-bold text-xl text-primary-600 dark:text-primary-400">
                      ₹{order.gross_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-6">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Order Summary</span>
                  <p className="text-sm">{order.items_summary}</p>
                </div>

                {rejectingId === order.id ? (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2">
                    <label className="block text-xs font-medium text-red-800 dark:text-red-400 mb-2">
                      Reason for Rejection
                    </label>
                    <select 
                      className="w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800/50 rounded-md text-sm p-2 mb-3 outline-none focus:border-red-400 transition-colors"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    >
                      <option value="Out of stock">Items out of stock</option>
                      <option value="Kitchen too busy">Kitchen too busy</option>
                      <option value="Restaurant closing">Restaurant closing</option>
                    </select>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleReject(order.id)}
                        disabled={isRejecting}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
                      </button>
                      <button 
                        onClick={() => setRejectingId(null)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setRejectingId(order.id)}
                      className="flex-1 py-2.5 bg-white dark:bg-gray-800 border-2 border-red-100 hover:border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:border-red-800/50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-medium transition-all duration-200 flex justify-center items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button 
                      onClick={() => handleAccept(order.id)}
                      disabled={isAccepting === order.id}
                      className="flex-[2] py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all duration-200 shadow-sm shadow-primary-600/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isAccepting === order.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <><CheckCircle className="w-4 h-4" /> Accept & KOT</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
