/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Send, 
  Smartphone, 
  ArrowDownLeft, 
  Plus, 
  ArrowRightLeft, 
  Globe2, 
  ShoppingBag, 
  History, 
  User, 
  ShieldCheck, 
  CreditCard, 
  X, 
  QrCode, 
  Home, 
  MessageSquare, 
  Wallet, 
  PieChart, 
  LogOut, 
  LogIn, 
  Info,
  ChevronRight,
  Heart,
  ReceiptText,
  GraduationCap,
  Plane,
  TrainFront,
  PiggyBank,
  Briefcase,
  Sparkles,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  runTransaction
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { db, auth, RecaptchaVerifier, signInWithPhoneNumber } from './lib/firebase';

// --- Types ---

type TransactionType = 'send' | 'recharge' | 'cashout' | 'payment' | 'add_money' | 'transfer' | 'remittance' | 'budget' | 'bill' | 'edu_fee' | 'air_tickets' | 'rail_tickets' | 'savings' | 'debenture' | 'donate' | 'sheba_ai';

interface WalletUser {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  balance: number;
  isVerified?: boolean;
  nidNumber?: string;
  phone?: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  recipient: string;
  note?: string;
  timestamp: any;
  status: 'success' | 'pending' | 'failed';
}

interface UserCard {
  id: string;
  userId: string;
  cardHolderName: string;
  cardNumber: string; // Storing full numbered as requested to be "real", UI will show last 4
  cardType: 'visa' | 'mastercard' | 'amex';
  expiryDate: string;
}

const SERVICES = [
  { id: 'send', label: 'Send Money', icon: Send, color: 'text-sky-600' },
  { id: 'recharge', label: 'Recharge', icon: Smartphone, color: 'text-sky-600' },
  { id: 'cashout', label: 'Cashout', icon: ArrowDownLeft, color: 'text-sky-600' },
  { id: 'add_money', label: 'Add Money', icon: Plus, color: 'text-sky-600' },
  { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'text-sky-600' },
  { id: 'budget', label: 'Budget', icon: PieChart, color: 'text-sky-600' },
  { id: 'payment', label: 'Payment', icon: ShoppingBag, color: 'text-sky-600' },
  { id: 'bill', label: 'Bill', icon: ReceiptText, color: 'text-sky-600' },
  { id: 'edu_fee', label: 'Edu fee', icon: GraduationCap, color: 'text-sky-600' },
  { id: 'air_tickets', label: 'Air Tickets', icon: Plane, color: 'text-sky-600' },
  { id: 'rail_tickets', label: 'Rail Tickets', icon: TrainFront, color: 'text-sky-600' },
  { id: 'remittance', label: 'Remittance', icon: Globe2, color: 'text-sky-600' },
  { id: 'savings', label: 'Savings', icon: PiggyBank, color: 'text-sky-600' },
  { id: 'debenture', label: 'Debenture', icon: Briefcase, color: 'text-sky-600' },
  { id: 'donate', label: 'Donate', icon: Heart, color: 'text-sky-600' },
  { id: 'sheba_ai', label: 'Sheba Ai', icon: Sparkles, color: 'text-amber-500' },
];

function handleFirestoreError(error: any) {
  console.error("Firestore Error:", error);
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [walletUser, setWalletUser] = useState<WalletUser | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'wallet' | 'explore' | 'profile'>('home');
  const [selectedFeature, setSelectedFeature] = useState<TransactionType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [balanceChanged, setBalanceChanged] = useState(false);
  const [activeContact, setActiveContact] = useState<{name: string, phone: string} | null>(null);
  const [step, setStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isNidVerifying, setIsNidVerifying] = useState(false);
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Filter states
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const MOCK_CONTACTS = [
    { name: 'Abdur Rahman', phone: '01712345678' },
    { name: 'Fatima Begum', phone: '01987654321' },
    { name: 'Kamal Ahmed', phone: '01855667788' },
    { name: 'Sumi Akter', phone: '01399887766' },
    { name: 'Jony Sheikh', phone: '01511223344' },
    { name: 'Customer Support', phone: '16247' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            const newUser: WalletUser = {
              userId: user.uid,
              displayName: user.displayName || 'User',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              balance: 100.0
            };
            await setDoc(userRef, newUser);
          }
        } else {
          setWalletUser(null);
          setTransactions([]);
          setCards([]);
        }
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    });
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    return onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        const newData = snapshot.data() as WalletUser;
        setWalletUser(prev => {
          if (prev && prev.balance !== newData.balance) {
            setBalanceChanged(true);
            setTimeout(() => setBalanceChanged(false), 1000);
          }
          return newData;
        });
      }
    }, (error) => console.error("Balance Listener Error:", error));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txs);
    }, handleFirestoreError);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'users', currentUser.uid, 'cards'));
    return onSnapshot(q, (snapshot) => {
      const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserCard));
      setCards(c);
    }, handleFirestoreError);
  }, [currentUser]);

  const handleTransaction = async (type: TransactionType, amount: number, recipient: string, note?: string) => {
    if (!currentUser || !walletUser) return;
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User missing");
        const currentBalance = userSnap.data().balance;
        const isIncoming = ['add_money', 'remittance', 'savings'].includes(type);
        if (!isIncoming && currentBalance < amount) throw new Error("Insufficient Balance");
        const newBalance = isIncoming ? currentBalance + amount : currentBalance - amount;
        transaction.update(userRef, { balance: newBalance, updatedAt: serverTimestamp() });
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, { 
          userId: currentUser.uid, 
          type, 
          amount, 
          recipient, 
          note: note || "",
          status: 'success', 
          timestamp: serverTimestamp() 
        });
      });
      setSelectedFeature(null);
      setActiveContact(null);
      setStep(0);
    } catch (e: any) {
      if (e.message === "Insufficient Balance") alert("ব্যালেন্স নেই");
      else handleFirestoreError(e);
    }
  };

  const handleSaveCard = async (cardData: Omit<UserCard, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const cardRef = doc(collection(db, 'users', currentUser.uid, 'cards'));
    await setDoc(cardRef, {
      userId: currentUser.uid,
      ...cardData
    }).catch(handleFirestoreError);
    setIsAddingCard(false);
  };

  const closeFeature = () => {
    setSelectedFeature(null);
    setActiveContact(null);
    setStep(0);
  };

  if (loading) return <div className="min-h-screen bg-sky-400 flex items-center justify-center text-white text-2xl font-black">সেবা</div>;

  if (!currentUser) {
    const setupRecaptcha = () => {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      }
    };

    const handlePhoneSignIn = async () => {
      if (!phoneNumber.startsWith('+')) {
        alert("Please use international format (e.g., +88017...)");
        return;
      }
      try {
        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(result);
        setLoginStep('otp');
      } catch (err) {
        console.error(err);
        alert("Phone selection failed. Try again.");
      }
    };

    const handleVerifyOtp = async () => {
      try {
        await confirmationResult.confirm(otp);
      } catch (err) {
        alert("Invalid OTP");
      }
    };

    return (
      <div className="min-h-screen bg-sky-400 flex flex-col items-center justify-center p-8 space-y-8 text-white relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />

        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center space-y-4">
           <Wallet className="w-20 h-20 bg-white/20 p-5 rounded-[2.5rem] shadow-2xl" />
           <h1 className="text-6xl font-black tracking-tighter">সেবা</h1>
           <p className="text-white/60 font-black uppercase text-[10px] tracking-[0.3em]">Digital Wallet Solution</p>
        </motion.div>

        <div className="w-full max-w-sm space-y-4 z-10">
          <div id="recaptcha-container"></div>
          
          <AnimatePresence mode="wait">
            {loginStep === 'phone' && (
              <motion.div key="p" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Mobile Number</label>
                   <input 
                      value={phoneNumber} 
                      onChange={e => setPhoneNumber(e.target.value)} 
                      placeholder="+88017..." 
                      className="w-full p-5 bg-white/10 border border-white/20 rounded-3xl outline-none font-black text-xl placeholder:text-white/30"
                   />
                </div>
                <button onClick={handlePhoneSignIn} className="w-full bg-white text-sky-500 p-5 rounded-3xl font-black active:scale-95 shadow-xl">Get OTP</button>
              </motion.div>
            )}

            {loginStep === 'otp' && (
              <motion.div key="o" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest ml-2 opacity-60">Enter OTP</label>
                   <input 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)} 
                      placeholder="000000" 
                      className="w-full p-5 bg-white/10 border border-white/20 rounded-3xl outline-none font-black text-4xl text-center tracking-[0.5em] placeholder:text-white/30"
                   />
                </div>
                <div className="flex flex-col gap-3">
                   <button onClick={handleVerifyOtp} className="w-full bg-white text-sky-500 p-5 rounded-3xl font-black active:scale-95 shadow-xl transition-transform hover:scale-[1.02]">Verify & Login</button>
                   <button onClick={() => setLoginStep('phone')} className="w-full text-white/60 font-black text-[10px] uppercase tracking-widest">Change Number</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Sub-page for services
  if (selectedFeature) {
    const config = SERVICES.find(s => s.id === selectedFeature) || { label: selectedFeature, icon: Send, color: 'text-sky-600' };
    const showContacts = ['send', 'cashout', 'payment', 'recharge'].includes(selectedFeature);

    return (
      <div className="min-h-screen bg-white font-sans text-sky-950 flex flex-col">
        <header className="bg-sky-400 text-white p-6 pt-12 rounded-b-3xl shadow-lg flex items-center gap-4">
          <button onClick={closeFeature} className="p-2 bg-white/20 rounded-xl">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <config.icon className="w-6 h-6" />
            <h2 className="text-xl font-black">{config.label}</h2>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 0 && showContacts && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="contacts" className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-sky-300 tracking-widest px-2">Recipient Number</label>
                  <div className="relative">
                    <input 
                      placeholder="Enter mobile number" 
                      className="w-full p-5 bg-sky-50 rounded-2xl outline-none font-bold text-lg pr-14"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            setActiveContact({ name: val, phone: val });
                            setStep(1);
                          }
                        }
                      }}
                    />
                    {['send', 'cashout', 'payment'].includes(selectedFeature || '') && (
                      <button 
                        type="button"
                        onClick={() => setIsScanning(true)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-sky-400 text-white rounded-xl shadow-lg shadow-sky-100 active:scale-95 transition-all"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-sky-900/40 uppercase tracking-widest px-2">Phone Contacts</h3>
                  <div className="space-y-2">
                    {MOCK_CONTACTS.map((contact, i) => (
                      <button 
                        key={i} 
                        onClick={() => {
                          setActiveContact(contact);
                          setStep(1);
                        }}
                        className="w-full flex items-center gap-4 p-4 hover:bg-sky-50 rounded-2xl transition-colors text-left group"
                      >
                        <div className="w-12 h-12 bg-sky-400/10 rounded-full flex items-center justify-center font-black text-sky-400 group-hover:bg-sky-400 group-hover:text-white transition-all">
                          {contact.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-sm">{contact.name}</p>
                          <p className="text-xs font-bold text-sky-300">{contact.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {(step === 1 || !showContacts) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="form" className="space-y-6">
                {activeContact && (
                  <div className="bg-sky-50 p-6 rounded-3xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-sky-300 uppercase">To Recipient</p>
                      <p className="font-black text-lg">{activeContact.name}</p>
                      <p className="font-bold text-xs text-sky-300">{activeContact.phone}</p>
                    </div>
                    <button onClick={() => setStep(0)} className="text-sky-400 font-black text-[10px] uppercase">Edit</button>
                  </div>
                )}

                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const amount = (form.elements.namedItem('amount') as HTMLInputElement).value;
                    const note = (form.elements.namedItem('note') as HTMLInputElement).value;
                    const recipient = activeContact ? activeContact.phone : (form.elements.namedItem('recipient') as HTMLInputElement)?.value || "User";
                    await handleTransaction(selectedFeature, parseFloat(amount), recipient, note);
                  }}
                  className="space-y-6"
                >
                  {!activeContact && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-sky-300 tracking-widest px-2">Recipient / Reference</label>
                      <input name="recipient" required placeholder="Mobile or Name" className="w-full p-5 bg-sky-50 rounded-2xl outline-none font-bold text-lg" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-sky-300 tracking-widest px-2">Amount (৳)</label>
                    <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full p-6 bg-sky-50 rounded-2xl outline-none font-black text-4xl tracking-tighter" />
                    <p className="text-[10px] text-sky-300 font-bold px-2 uppercase">Limit: ৳{walletUser?.balance.toLocaleString()}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-sky-300 tracking-widest px-2">Notes</label>
                    <textarea name="note" placeholder="Optional" className="w-full p-5 bg-sky-50 rounded-2xl outline-none font-bold h-24 resize-none" />
                  </div>

                  <button type="submit" className="w-full bg-sky-400 text-white py-6 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">
                    Confirm {config.label}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-sky-950 pb-24 overflow-x-hidden">
      <header className="bg-sky-400 text-white p-4 pt-10 rounded-b-[2rem] shadow-lg relative overflow-hidden">
         <div className="max-w-md mx-auto relative z-10 space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                     {currentUser.photoURL ? <img src={currentUser.photoURL} alt="p" className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="text-left leading-none"><h4 className="text-sm font-black truncate max-w-[100px]">{walletUser?.displayName}</h4></div>
               </div>
               <button onClick={() => signOut(auth)} className="w-9 h-9 flex items-center justify-center"><LogOut className="w-5 h-5" /></button>
            </div>
            <div className="text-center py-2">
               <motion.button onClick={() => setShowBalance(!showBalance)} className="flex flex-col items-center gap-2 w-full">
                 <h2 className="text-5xl font-black tracking-tighter shadow-sm">সেবা</h2>
                 <motion.div 
                   animate={balanceChanged ? { scale: [1, 1.1, 1], backgroundColor: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'] } : {}}
                   className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 flex items-center gap-2 min-w-[150px] justify-center transition-all"
                 >
                   {showBalance ? (
                     <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-black">
                       ৳ {walletUser?.balance.toLocaleString()}
                     </motion.span>
                   ) : (
                     <span className="text-[10px] uppercase font-black tracking-widest">ব্যালেন্স দেখুন</span>
                   )}
                 </motion.div>
               </motion.button>
            </div>
         </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-10 space-y-12">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="h" className="space-y-12">
              <section className="grid grid-cols-3 gap-y-12">
                 {SERVICES.map(s => (
                   <button key={s.id} onClick={() => setSelectedFeature(s.id as TransactionType)} className="flex flex-col items-center gap-3 active:scale-95">
                      <div className={`w-16 h-16 flex items-center justify-center rounded-[1.5rem] transition-all ${s.id === 'send' ? 'bg-sky-400 shadow-lg shadow-sky-100' : ''}`}>
                        <s.icon className={`w-10 h-10 ${s.id === 'send' ? 'text-white' : s.color}`} strokeWidth={1.5} />
                      </div>
                      <p className="text-[10px] font-black uppercase text-center">{s.label}</p>
                   </button>
                 ))}
              </section>
              <section className="space-y-4">
                 <h3 className="text-xs font-black text-sky-900/40 uppercase tracking-widest">Recent Actions</h3>
                 {transactions.slice(0, 5).map(tx => (
                   <div key={tx.id} className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-sky-50 shadow-sm">
                      <div className="w-12 h-12 flex items-center justify-center"><History className="w-7 h-7 text-sky-400" /></div>
                      <div className="flex-1">
                        <h5 className="text-sm font-black">{tx.recipient}</h5>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-bold text-sky-300 uppercase">{tx.type}</span>
                           {tx.note && <span className="text-[7px] text-sky-200 bg-sky-50 px-1 rounded truncate max-w-[50px]">{tx.note}</span>}
                        </div>
                      </div>
                      <div className="text-right leading-none">
                        <p className={`text-sm font-black ${['add_money', 'remittance', 'savings'].includes(tx.type) ? 'text-emerald-500' : 'text-sky-900'}`}>
                           {['add_money', 'remittance', 'savings'].includes(tx.type) ? '+' : '-'}৳{tx.amount}
                        </p>
                      </div>
                   </div>
                 ))}
              </section>
            </motion.div>
          )}

          {activeTab === 'wallet' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="w" className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">আমার কার্ড সমূহ</h3>
                <button 
                  onClick={() => setIsAddingCard(true)}
                  className="bg-sky-400 text-white p-2 rounded-xl shadow-lg shadow-sky-100 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="bg-sky-50 rounded-[2.5rem] py-16 px-6 text-center space-y-4 border-2 border-dashed border-sky-100">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CreditCard className="w-8 h-8 text-sky-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-sky-900">কোনো কার্ড নেই</p>
                    <p className="text-[10px] text-sky-300 font-bold uppercase tracking-widest leading-relaxed">আপনার VISA বা Mastercard যোগ করুন</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingCard(true)}
                    className="bg-white text-sky-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-100 shadow-sm"
                  >
                    শুরু করুন
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cards.map(card => {
                    const cardTheme = card.cardType === 'visa' 
                      ? 'bg-gradient-to-br from-sky-400 to-sky-600' 
                      : card.cardType === 'mastercard' 
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900' 
                        : 'bg-gradient-to-br from-indigo-500 to-indigo-700';

                    return (
                      <div 
                        key={card.id} 
                        className={`h-52 ${cardTheme} rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group transition-all hover:-translate-y-1`}
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><CreditCard className="w-32 h-32" /></div>
                        
                        <div className="flex justify-between relative z-10 items-start">
                          <Wallet className="w-8 h-8 opacity-50" />
                          <div className="text-right">
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Sheba Secure</span>
                             <p className="text-sm font-black uppercase tracking-widest">{card.cardType}</p>
                          </div>
                        </div>

                        <div className="mt-8 relative z-10">
                          <p className="text-2xl font-mono tracking-[0.3em] font-medium">
                            {`****  ****  ****  ${card.cardNumber.slice(-4)}`}
                          </p>
                        </div>

                        <div className="flex justify-between items-end relative z-10 mt-auto">
                          <div className="space-y-0.5">
                            <p className="text-[8px] opacity-50 font-black uppercase tracking-widest text-white/80">Card Holder</p>
                            <p className="font-black uppercase text-xs tracking-wide">{card.cardHolderName}</p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="text-[8px] opacity-50 font-black uppercase tracking-widest text-white/80">Expires</p>
                            <p className="font-black text-xs">{card.expiryDate}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'explore' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="e" className="space-y-6">
               <div className="flex flex-col gap-4 bg-sky-50/50 p-6 rounded-[2rem] border border-sky-100">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-sky-300 tracking-widest px-1">Filter by Type</label>
                     <select 
                       value={filterType}
                       onChange={(e) => setFilterType(e.target.value)}
                       className="w-full bg-white p-3 rounded-xl border border-sky-100 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-400"
                     >
                        <option value="all">All Transactions</option>
                        {SERVICES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-sky-300 tracking-widest px-1">From</label>
                        <input 
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-white p-3 rounded-xl border border-sky-100 text-xs font-bold outline-none" 
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-sky-300 tracking-widest px-1">To</label>
                        <input 
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-white p-3 rounded-xl border border-sky-100 text-xs font-bold outline-none" 
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-4 pb-12">
                 {(() => {
                   const filtered = transactions.filter(tx => {
                     const matchesType = filterType === 'all' || tx.type === filterType;
                     const txDate = tx.timestamp?.toDate ? tx.timestamp.toDate() : null;
                     
                     let matchesDate = true;
                     if (startDate && txDate) {
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);
                        matchesDate = matchesDate && txDate >= start;
                     }
                     if (endDate && txDate) {
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        matchesDate = matchesDate && txDate <= end;
                     }
                     
                     return matchesType && matchesDate;
                   });

                   if (filtered.length === 0) {
                     return <div className="text-center py-20"><p className="text-sky-200 uppercase font-black tracking-widest text-xs">No matching transactions</p></div>;
                   }

                   return filtered.map(tx => (
                     <div key={tx.id} className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-sky-50 shadow-sm transition-all hover:border-sky-200">
                        <div className="w-12 h-12 flex items-center justify-center"><History className="w-7 h-7 text-sky-400" /></div>
                        <div className="flex-1">
                           <h5 className="text-sm font-black text-sky-950 truncate max-w-[120px]">{tx.recipient}</h5>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-sky-300 uppercase tracking-widest">{tx.type.replace('_', ' ')}</span>
                              {tx.note && <span className="text-[7px] text-sky-200 bg-sky-50 px-1 rounded truncate max-w-[70px]">{tx.note}</span>}
                           </div>
                        </div>
                        <div className="text-right leading-none">
                           <p className={`text-sm font-black ${['add_money', 'remittance', 'savings'].includes(tx.type) ? 'text-emerald-500' : 'text-sky-900'}`}>
                              {['add_money', 'remittance', 'savings'].includes(tx.type) ? '+' : '-'}৳{tx.amount.toFixed(2)}
                           </p>
                           <p className="text-[9px] text-sky-200 font-black uppercase tracking-tight mt-1">
                             {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '...'}
                           </p>
                        </div>
                     </div>
                   ));
                 })()}
               </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="p" className="space-y-8">
              <div className="bg-sky-50 p-8 rounded-[2.5rem] text-center space-y-4">
                <div className="relative inline-block">
                  <img src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${walletUser?.displayName}&background=38bdf8&color=fff`} className="w-24 h-24 rounded-full mx-auto" alt="p" />
                  {walletUser?.isVerified && <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-4 border-white"><ShieldCheck className="w-4 h-4" /></div>}
                </div>
                <h2 className="text-2xl font-black">{walletUser?.displayName}</h2>
                <div className="space-y-2">
                    <button onClick={() => setIsNidVerifying(true)} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl group transition-all hover:bg-sky-400">
                        <div className="flex items-center gap-3">
                           <ShieldCheck className="w-5 h-5 text-sky-400 group-hover:text-white" />
                           <span className="font-bold text-sm group-hover:text-white">NID Verification</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${walletUser?.isVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                             {walletUser?.isVerified ? 'Verified' : 'Unverified'}
                           </span>
                           <ChevronRight className="w-4 h-4 group-hover:text-white" />
                        </div>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl">
                        <span className="font-bold text-sm">Security</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl">
                        <span className="font-bold text-sm">Support</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => signOut(auth)} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl text-red-500">
                        <span className="font-black text-sm uppercase">Sign Out</span>
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
         <nav className="max-w-md mx-auto bg-white/95 backdrop-blur-md border border-sky-100 rounded-[2.5rem] p-2 flex items-center justify-between shadow-xl pointer-events-auto">
            <button onClick={() => setActiveTab('home')} className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${activeTab === 'home' ? 'text-sky-400' : 'text-sky-200'}`}>
              <Home className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-tighter">হোম</span>
            </button>
            <button onClick={() => setActiveTab('wallet')} className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${activeTab === 'wallet' ? 'text-sky-400' : 'text-sky-200'}`}>
              <CreditCard className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-tighter">কার্ড</span>
            </button>
            <div className="relative bottom-4">
              <button className="w-14 h-14 bg-sky-500 rounded-full flex items-center justify-center shadow-lg shadow-sky-200 active:scale-90 transition-transform">
                <QrCode className="w-7 h-7 text-white" />
              </button>
            </div>
            <button onClick={() => setActiveTab('explore')} className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${activeTab === 'explore' ? 'text-sky-400' : 'text-sky-200'}`}>
              <History className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-tighter">ইতিহাস</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${activeTab === 'profile' ? 'text-sky-400' : 'text-sky-200'}`}>
              <User className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-tighter">প্রোফাইল</span>
            </button>
         </nav>
      </footer>

      <AnimatePresence>
        {isAddingCard && (
          <AddCardModal onClose={() => setIsAddingCard(false)} onSave={handleSaveCard} />
        )}
        {isScanning && (
          <QRScanner 
            onScan={(data) => {
              setActiveContact({ name: data, phone: data });
              setStep(1);
              setIsScanning(false);
            }} 
            onClose={() => setIsScanning(false)} 
          />
        )}
        {isNidVerifying && (
          <NIDVerificationModal 
            user={walletUser} 
            onClose={() => setIsNidVerifying(false)} 
            onVerify={async (nid) => {
              if (!currentUser) return;
              await setDoc(doc(db, 'users', currentUser.uid), {
                isVerified: true,
                nidNumber: nid
              }, { merge: true });
              setIsNidVerifying(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NIDVerificationModal({ user, onClose, onVerify }: { user: WalletUser | null, onClose: () => void, onVerify: (nid: string) => Promise<void> }) {
  const [nid, setNid] = useState('');
  const [step, setStep] = useState(0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-sky-900/60 backdrop-blur-md z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[4rem] p-10 relative">
         <button onClick={onClose} className="absolute top-10 right-10 text-sky-200"><X className="w-6 h-6" /></button>
         
         <div className="space-y-2 mb-10">
            <h3 className="text-3xl font-black tracking-tight">জাতীয় পরিচয়পত্র</h3>
            <p className="text-[10px] font-black text-sky-300 uppercase tracking-widest">NID Verification System</p>
         </div>

         {user?.isVerified ? (
           <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                 <ShieldCheck className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black">আপনার অ্যাকাউন্ট ভেরিফাইড!</h4>
              <p className="text-sm font-bold text-sky-300">NID: **** **** {user.nidNumber?.slice(-4)}</p>
           </div>
         ) : (
           <div className="space-y-8">
              {step === 0 ? (
                <div className="space-y-6">
                  <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 flex items-start gap-4">
                     <Info className="w-6 h-6 text-sky-400 mt-1" />
                     <p className="text-[11px] font-bold text-sky-900/60 leading-relaxed uppercase">আপনার ১০ বা ১৭ ডিজিটের এনআইডি নম্বরটি প্রদান করুন সঠিকভাবে ভেরিফিকেশন সম্পন্ন করতে।</p>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-sky-300 uppercase tracking-widest ml-2">NID NUMBER</label>
                     <input 
                        value={nid} 
                        onChange={e => setNid(e.target.value)} 
                        placeholder="0000 0000 00" 
                        className="w-full p-6 bg-sky-50 rounded-3xl outline-none font-black text-3xl tracking-tighter" 
                     />
                  </div>
                  <button onClick={() => setStep(1)} className="w-full bg-sky-400 text-white py-6 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all">
                     পরবর্তী ধাপ
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-sky-50 aspect-video rounded-3xl border-2 border-dashed border-sky-100 flex flex-col items-center justify-center text-sky-300 gap-2">
                        <Camera className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase">Front View</span>
                      </div>
                      <div className="bg-sky-50 aspect-video rounded-3xl border-2 border-dashed border-sky-100 flex flex-col items-center justify-center text-sky-300 gap-2">
                        <Camera className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase">Back View</span>
                      </div>
                   </div>
                   <button 
                      onClick={() => onVerify(nid)} 
                      className="w-full bg-sky-400 text-white py-6 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all"
                   >
                     সাবমিট ভেরিফিকেশন
                   </button>
                   <button onClick={() => setStep(0)} className="w-full text-sky-300 font-black text-[10px] uppercase">পূর্ববর্তী ধাপ</button>
                </div>
              )}
           </div>
         )}
      </motion.div>
    </motion.div>
  );
}

function QRScanner({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    scanner.render((data) => {
      onScan(data);
      scanner.clear().catch(e => console.error(e));
    }, (error) => {
      // console.warn(error);
    });

    return () => {
      scanner.clear().catch(e => {
        // Just catch the error if it's already cleared or not rendered
      });
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-6"
    >
      <div className="flex justify-between w-full mb-8 items-center px-4">
         <div className="flex items-center gap-3">
           <Camera className="w-6 h-6 text-sky-400" />
           <h3 className="text-white font-black text-xl tracking-tight">QR স্ক্যান করুন</h3>
         </div>
         <button onClick={onClose} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
           <X className="w-6 h-6" />
         </button>
      </div>
      
      <div className="relative w-full max-w-sm flex flex-col items-center">
        <div 
          id="reader" 
          className="w-full overflow-hidden rounded-[2.5rem] border-4 border-sky-400 shadow-[0_0_50px_rgba(56,189,248,0.3)] bg-zinc-900"
        ></div>
        
        {/* Decorative scan overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
           <div className="w-64 h-64 border-2 border-dashed border-white/20 rounded-3xl" />
        </div>
      </div>
      
      <div className="mt-12 text-center space-y-2">
        <p className="text-white font-black text-sm uppercase tracking-widest">Scanning...</p>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed">প্রাপকের QR কোডটি ফ্রেমের ভেতরে রাখুন</p>
      </div>
    </motion.div>
  );
}

function AddCardModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<UserCard, 'id' | 'userId'>) => void }) {
  const [formData, setFormData] = useState({
    cardHolderName: '',
    cardNumber: '',
    cardType: 'visa' as const,
    expiryDate: ''
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 bg-sky-900/60 backdrop-blur-md z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-sm rounded-t-[3rem] sm:rounded-[3rem] p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-sky-100/50" />
        <button onClick={onClose} className="absolute top-8 right-8 text-sky-200 hover:text-sky-400 transition-colors"><X className="w-6 h-6" /></button>
        
        <div className="space-y-1 mb-8">
          <h3 className="text-3xl font-black tracking-tight">নতুন কার্ড</h3>
          <p className="text-[10px] font-black text-sky-300 uppercase tracking-widest">VISA, MASTERCARD অথবা AMEX যোগ করুন</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-sky-300 uppercase tracking-widest ml-1">Card Holder Name</label>
             <input required placeholder="আপনার নাম লিখুন" className="w-full p-4 bg-sky-50 rounded-2xl outline-none font-bold text-sky-950 focus:ring-2 focus:ring-sky-400 transition-all font-sans" onChange={e => setFormData({...formData, cardHolderName: e.target.value})} />
           </div>

           <div className="space-y-1.5">
             <label className="text-[9px] font-black text-sky-300 uppercase tracking-widest ml-1">Card Number</label>
             <input required placeholder="0000 0000 0000 0000" maxLength={16} className="w-full p-4 bg-sky-50 rounded-2xl outline-none font-bold text-sky-950 focus:ring-2 focus:ring-sky-400 transition-all font-sans" onChange={e => setFormData({...formData, cardNumber: e.target.value})} />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-sky-300 uppercase tracking-widest ml-1">Type</label>
                <select className="w-full p-4 bg-sky-50 rounded-2xl outline-none font-black text-sky-950 focus:ring-2 focus:ring-sky-400 transition-all appearance-none" onChange={e => setFormData({...formData, cardType: e.target.value as any})}>
                  <option value="visa">VISA</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">Amex</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-sky-300 uppercase tracking-widest ml-1">Expiry</label>
                <input required placeholder="MM/YY" maxLength={5} className="w-full p-4 bg-sky-50 rounded-2xl outline-none font-bold text-sky-950 focus:ring-2 focus:ring-sky-400 transition-all font-sans" onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
           </div>

           <button type="submit" className="w-full bg-sky-400 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-sky-100 hover:bg-sky-500 active:scale-95 transition-all mt-4">
             কার্ড সেভ করুন
           </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
