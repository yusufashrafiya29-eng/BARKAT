const fs = require('fs');

const path = 'C:/Users/Preneel/Desktop/raaziya malek/BARKAT/frontend/src/pages/OwnerDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove QrCode from import
code = code.replace('Clock, QrCode, CreditCard', 'Clock, CreditCard');

// 2. Remove unused interfaces
code = code.replace(/interface MenuCategory[\s\S]*?interface Reservation \{[\s\S]*?\}/, '');

// 3. Remove unused variables from useOwnerStore
code = code.replace('fetchData, silentlyFetchData, tables, reservations, inventory, menuCategories, upiId, razorpayKeys', 
                    'fetchData, tables, reservations, inventory');

// 4. Add missing state
code = code.replace("const [menuAddType, setMenuAddType] = useState('item');",
`const [menuAddType, setMenuAddType] = useState('item');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<'basic' | 'pro' | 'max'>('pro');`);

fs.writeFileSync(path, code);
console.log('Fixed OwnerDashboard.tsx');
