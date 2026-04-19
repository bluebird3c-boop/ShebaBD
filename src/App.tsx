/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { 
  Send, 
  Smartphone, 
  ArrowDownLeft, 
  Plus, 
  ArrowRightLeft, 
  Globe2, 
  ShoppingBag, 
  History, 
  Settings, 
  Bell, 
  ChevronRight, 
  User, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  X, 
  QrCode, 
  Home, 
  MessageSquare, 
  Wallet, 
  PieChart, 
  ArrowUpRight,
  LayoutGrid,
  Menu,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type TransactionType = 'send' | 'recharge' | 'cashout' | 'payment' | 'add_money' | 'transfer' | 'remittance';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  recipient: string;
  date: Date;
  status: 'success' | 'pending' | 'failed';
}

const SERVICES = [
  { id: 'send', label: 'Send Money', icon: Send, color: 'text-sky-600', bg: 'bg-sky-50', bn: 'সেন্ড মানি' },
  { id: 'recharge', label: 'Recharge', icon: Smartphone, color: 'text-sky-600', bg: 'bg-sky-50', bn: 'রিচার্জ' },
  { id: 'cashout', label: 'Cash Out', icon: ArrowDownLeft, color: 'text-sky-600', bg: 'bg-sky-50', bn: 'ক্যাশআউট' },
  { id: 'payment', label: 'Payment', icon: ShoppingBag, color: 'text-sky-600', bg: 'bg-sky-50', bn: 'পেমেন্ট' },
  { id: 'add_money', label: 'Add Money', icon: Plus, color: 'text-sky-600', bg: 'bg-sky-50', bn: 'অ্যাডমানি' },
  { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'text-sky-600', bg: 'bg-sky-50', bn: 'ট্রান্সফার' },
  { id: 'remittance', label: 'Remittance', icon: Globe2, color: 'text-sky-600', bg: 'bg-sky-50', bn: 'রেমিট্যান্স' },
];

export default function App() {
  const [balance, setBalance] = useState(38450.25);
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'wallet' | 'explore' | 'profile'>('home');
  const [selectedFeature, setSelectedFeature] = useState<TransactionType | null>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 'TXN-001', type: 'payment', amount: 800, recipient: 'Aarong', date: new Date(Date.now() - 3600000), status: 'success' },
    { id: 'TXN-002', type: 'send', amount: 1200, recipient: 'Mother', date: new Date(Date.now() - 86400000), status: 'success' },
    { id: 'TXN-003', type: 'recharge', amount: 50, recipient: 'My Phone', date: new Date(Date.now() - 172800000), status: 'success' },
  ]);

  const handleTransaction = (type: TransactionType, amount: number, recipient: string) => {
    const newTx: Transaction = {
      id: `TXN-${Math.floor(Math.random() * 1000 + 100)}`,
      type,
      amount,
      recipient,
      date: new Date(),
      status: 'success'
    };
    setTransactions([newTx, ...transactions]);
    if (type === 'add_money' || type === 'remittance') {
      setBalance(prev => prev + amount);
    } else {
      setBalance(prev => prev - amount);
    }
    setSelectedFeature(null);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-sky-950 pb-24 selection:bg-sky-100 overflow-x-hidden">
      {/* Dynamic Sky Header */}
      <header className="bg-sky-400 text-white p-6 pt-12 rounded-b-[3rem] shadow-xl shadow-sky-100 relative overflow-hidden">
         {/* Decorative Clouds/Grads */}
         <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-white/20 rounded-full blur-3xl" />
         <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-sky-300/30 rounded-full blur-2xl" />

         <div className="max-w-md mx-auto relative z-10 space-y-8">
            <div className="flex items-center justify-between">
               <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                  <Menu className="w-5 h-5" />
               </button>
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                     <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-black tracking-tight text-xl">Sheba</span>
               </div>
               <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
               </button>
            </div>

            <div className="text-center py-4">
               {/* Clickable Headline "সেবা" to show balance */}
               <motion.button 
                 onClick={() => setShowBalance(!showBalance)}
                 whileTap={{ scale: 0.95 }}
                 className="group flex flex-col items-center gap-2 w-full"
               >
                 <h2 className="text-5xl font-black tracking-tighter drop-shadow-md group-hover:opacity-90 transition-opacity">
                   সেবা
                 </h2>
                 <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30 flex items-center gap-3 min-w-[180px] justify-center">
                   <AnimatePresence mode="wait">
                     {!showBalance ? (
                       <motion.span 
                         key="tap-text"
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -5 }}
                         className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90"
                       >
                         ব্যালেন্স দেখতে ট্যাপ করুন
                       </motion.span>
                     ) : (
                       <motion.span 
                         key="balance-val"
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 1.2 }}
                         className="text-lg font-black tracking-tight"
                       >
                         ৳ {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                       </motion.span>
                     )}
                   </AnimatePresence>
                 </div>
               </motion.button>
            </div>

            <div className="grid grid-cols-4 gap-4 px-2">
               {[
                 { id: 'add_money', icon: Plus, label: 'Add' },
                 { id: 'send', icon: Send, label: 'Send' },
                 { id: 'transfer', icon: ArrowRightLeft, label: 'Swap' },
                 { id: 'remittance', icon: Globe2, label: 'Remit' },
               ].map(item => (
                 <button 
                   key={item.id}
                   onClick={() => setSelectedFeature(item.id as TransactionType)}
                   className="flex flex-col items-center gap-2 group"
                 >
                    <div className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg group-active:scale-90 transition-transform">
                       <item.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                 </button>
               ))}
            </div>
         </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-10 space-y-12">
        {/* All Services Grid */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-sky-900/50 uppercase tracking-[0.2em]">Our Services</h3>
              <div className="h-px bg-sky-100 flex-1 ml-4" />
           </div>
           
           <div className="grid grid-cols-4 gap-y-10">
              {SERVICES.map((s) => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedFeature(s.id as TransactionType)}
                  className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
                >
                   <div className={`w-16 h-16 ${s.bg} rounded-3xl flex items-center justify-center shadow-lg shadow-sky-50 border border-sky-100/50 group`}>
                      <s.icon className={`w-7 h-7 ${s.color}`} strokeWidth={1.5} />
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] font-black text-sky-900 tracking-tight leading-none mb-1">{s.label}</p>
                     <p className="text-[9px] font-medium text-sky-400">{s.bn}</p>
                   </div>
                </button>
              ))}
              <button className="flex flex-col items-center gap-3 opacity-50">
                 <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center border border-dashed border-slate-200">
                    <LayoutGrid className="w-7 h-7 text-slate-300" />
                 </div>
                 <span className="text-[10px] font-black text-slate-400">MORE</span>
              </button>
           </div>
        </section>

        {/* Promo / Banner Card */}
        <section className="relative px-2">
           <div className="bg-sky-50 rounded-[2.5rem] p-8 border border-sky-100 overflow-hidden relative group cursor-pointer">
              <div className="absolute right-[-5%] bottom-[-10%] opacity-20 group-hover:scale-110 transition-transform duration-700">
                 <Heart className="w-32 h-32 text-sky-400 fill-current" />
              </div>
              <div className="relative z-10 space-y-2">
                 <span className="bg-sky-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Limited Offer</span>
                 <h4 className="text-2xl font-black text-sky-950 tracking-tight leading-tight">Get 10% Back on <br />Your First Pay</h4>
                 <p className="text-sky-600/70 text-xs font-medium">Use code <span className="text-sky-600 font-black">SHEBA10</span></p>
              </div>
           </div>
        </section>

        {/* History Section */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-sky-900/50 uppercase tracking-[0.2em]">Latest Actions</h3>
              <button className="text-sky-500 text-[10px] font-black uppercase tracking-widest">History</button>
           </div>
           
           <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-sky-50 shadow-sm hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <History className="w-5 h-5 text-sky-400" />
                   </div>
                   <div className="flex-1">
                      <h5 className="text-sm font-black text-sky-950">{tx.recipient}</h5>
                      <span className="text-[10px] font-bold text-sky-300 uppercase tracking-widest">{tx.type}</span>
                   </div>
                   <div className="text-right">
                      <p className={`text-sm font-black ${tx.type === 'add_money' || tx.type === 'remittance' ? 'text-teal-500' : 'text-sky-900'}`}>
                         {tx.type === 'add_money' || tx.type === 'remittance' ? '+' : '-'}৳{tx.amount.toFixed(2)}
                      </p>
                      <p className="text-[9px] text-sky-200 font-black uppercase tracking-tighter">{tx.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </main>

      {/* Floating Modern Tab Nav */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
         <nav className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-sky-100 rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl shadow-sky-100/50 pointer-events-auto">
            <button 
              onClick={() => setActiveTab('home')}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeTab === 'home' ? 'bg-sky-400 text-white shadow-lg' : 'text-sky-200 hover:text-sky-400'}`}
            >
               <Home className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeTab === 'wallet' ? 'bg-sky-400 text-white shadow-lg' : 'text-sky-200 hover:text-sky-400'}`}
            >
               <CreditCard className="w-6 h-6" />
            </button>
            <div className="relative">
               <button className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center shadow-xl shadow-sky-200 transform -translate-y-6 active:scale-90 transition-transform">
                  <QrCode className="w-8 h-8 text-white" />
               </button>
            </div>
            <button 
              onClick={() => setActiveTab('explore')}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeTab === 'explore' ? 'bg-sky-400 text-white shadow-lg' : 'text-sky-200 hover:text-sky-400'}`}
            >
               <PieChart className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeTab === 'profile' ? 'bg-sky-400 text-white shadow-lg' : 'text-sky-200 hover:text-sky-400'}`}
            >
               <User className="w-6 h-6" />
            </button>
         </nav>
      </footer>

      {/* Transaction Modal Layer */}
      <AnimatePresence>
        {selectedFeature && (
          <TransactionModal 
            type={selectedFeature} 
            onClose={() => setSelectedFeature(null)} 
            onSubmit={handleTransaction}
            balance={balance}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Specialized Internal Modal ---

function TransactionModal({ 
  type, 
  onClose, 
  onSubmit, 
  balance 
}: { 
  type: TransactionType; 
  onClose: () => void; 
  onSubmit: (type: TransactionType, amount: number, recipient: string) => void;
  balance: number;
}) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const config = SERVICES.find(s => s.id === type) || { label: type, icon: Send, color: 'text-sky-600', bg: 'bg-sky-50', bn: '' };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-sky-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 30, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-[3rem] p-10 relative z-10 shadow-3xl text-sky-950"
      >
        <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-sky-50 rounded-2xl text-sky-200">
           <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-4 mb-10 text-center">
           <div className={`w-20 h-20 ${config.bg} ${config.color} rounded-[2rem] flex items-center justify-center shadow-inner`}>
              <config.icon className="w-10 h-10" />
           </div>
           <div>
              <h3 className="text-2xl font-black tracking-tight">{config.label}</h3>
              <p className="text-[10px] text-sky-300 font-black uppercase tracking-[0.2em]">{config.bn}</p>
           </div>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          if (!amount || !recipient) return;
          onSubmit(type, parseFloat(amount), recipient);
        }} className="space-y-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-sky-200 uppercase tracking-widest px-2">Recipient</label>
              <input 
                required
                autoFocus
                placeholder="Mobile or Account Name"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-5 bg-sky-50 border-2 border-transparent rounded-[1.5rem] focus:border-sky-400 focus:bg-white transition-all font-bold text-lg outline-none"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-sky-200 uppercase tracking-widest px-2">Amount (৳)</label>
              <input 
                required
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-6 bg-sky-50 border-2 border-transparent rounded-[1.5rem] focus:border-sky-400 focus:bg-white transition-all font-black text-4xl outline-none tracking-tighter"
              />
              <p className="text-[10px] text-sky-300 font-bold px-2 uppercase">Balance: ৳{balance.toLocaleString('en-BD')}</p>
           </div>

           <button 
             type="submit"
             className="w-full bg-sky-400 text-white py-6 rounded-[2rem] font-black text-xl active:scale-95 transition-all shadow-xl shadow-sky-100"
           >
             Confirm
           </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
