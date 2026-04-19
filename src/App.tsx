/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
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
  Bell
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
import { db, auth, signInWithGoogle } from './lib/firebase';

// --- Types ---

type TransactionType = 'send' | 'recharge' | 'cashout' | 'payment' | 'add_money' | 'transfer' | 'remittance' | 'budget' | 'bill' | 'edu_fee' | 'air_tickets' | 'rail_tickets' | 'savings' | 'debenture' | 'donate' | 'sheba_ai';

interface WalletUser {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  balance: number;
}

interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  recipient: string;
  timestamp: any;
  status: 'success' | 'pending' | 'failed';
}

interface UserCard {
  id: string;
  userId: string;
  cardHolderName: string;
  cardNumberLast4: string;
  cardType: 'visa' | 'mastercard' | 'amex';
  expiryDate: string;
}

const SERVICES = [
  { id: 'send', label: 'Send Money', icon: Send, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'recharge', label: 'Recharge', icon: Smartphone, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'cashout', label: 'Cashout', icon: ArrowDownLeft, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'add_money', label: 'Add Money', icon: Plus, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'budget', label: 'Budget', icon: PieChart, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'payment', label: 'Payment', icon: ShoppingBag, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'bill', label: 'Bill', icon: ReceiptText, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'edu_fee', label: 'Edu fee', icon: GraduationCap, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'air_tickets', label: 'Air Tickets', icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'rail_tickets', label: 'Rail Tickets', icon: TrainFront, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'remittance', label: 'Remittance', icon: Globe2, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'savings', label: 'Savings', icon: PiggyBank, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'debenture', label: 'Debenture', icon: Briefcase, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'donate', label: 'Donate', icon: Heart, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'sheba_ai', label: 'Sheba Ai', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
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

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
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
          await setDoc(userRef, newUser).catch(handleFirestoreError);
        }
      } else {
        setWalletUser(null);
        setTransactions([]);
        setCards([]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    return onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
      if (doc.exists()) {
        setWalletUser(doc.data() as WalletUser);
      }
    }, handleFirestoreError);
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

  const handleTransaction = async (type: TransactionType, amount: number, recipient: string) => {
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
        transaction.set(txRef, { userId: currentUser.uid, type, amount, recipient, status: 'success', timestamp: serverTimestamp() });
      });
      setSelectedFeature(null);
    } catch (e: any) {
      if (e.message === "Insufficient Balance") alert("ব্যালেন্স নেই");
      else handleFirestoreError(e);
    }
  };

  const handleAddCard = async () => {
    if (!currentUser) return;
    const cardRef = doc(collection(db, 'users', currentUser.uid, 'cards'));
    await setDoc(cardRef, {
      userId: currentUser.uid,
      cardHolderName: currentUser.displayName || 'User',
      cardNumberLast4: Math.floor(1000 + Math.random() * 9000).toString(),
      cardType: 'visa',
      expiryDate: '12/28'
    });
  };

  if (loading) return <div className="min-h-screen bg-sky-400 flex items-center justify-center text-white text-2xl font-black">সেবা</div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-sky-400 flex flex-col items-center justify-center p-8 space-y-8 text-white">
        <Wallet className="w-16 h-16 bg-white/20 p-4 rounded-3xl" />
        <h1 className="text-6xl font-black">সেবা</h1>
        <button onClick={signInWithGoogle} className="bg-white text-sky-500 px-8 py-4 rounded-2xl font-black active:scale-95 flex items-center gap-3"><LogIn className="w-5 h-5" /> গুগল দিয়ে শুরু করুন</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-sky-950 pb-24 overflow-x-hidden">
      <header className="bg-sky-400 text-white p-4 pt-10 rounded-b-[2rem] shadow-lg relative overflow-hidden">
         <div className="max-w-md mx-auto relative z-10 space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full overflow-hidden border border-white/30 flex items-center justify-center">
                     {currentUser.photoURL ? <img src={currentUser.photoURL} alt="p" className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="text-left leading-none"><h4 className="text-sm font-black truncate max-w-[100px]">{walletUser?.displayName}</h4></div>
               </div>
               <button onClick={() => signOut(auth)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center"><LogOut className="w-5 h-5" /></button>
            </div>
            <div className="text-center py-2">
               <motion.button onClick={() => setShowBalance(!showBalance)} className="flex flex-col items-center gap-2 w-full">
                 <h2 className="text-5xl font-black tracking-tighter shadow-sm">সেবা</h2>
                 <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 flex items-center gap-2 min-w-[150px] justify-center">
                   {showBalance ? <span className="text-lg font-black">৳ {walletUser?.balance.toLocaleString()}</span> : <span className="text-[10px] uppercase font-black tracking-widest">ব্যালেন্স দেখুন</span>}
                 </div>
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
                      <div className={`w-16 h-16 ${s.bg} rounded-3xl flex items-center justify-center shadow-lg border border-sky-100/50`}><s.icon className={`w-7 h-7 ${s.color}`} /></div>
                      <p className="text-[10px] font-black uppercase text-center">{s.label}</p>
                   </button>
                 ))}
              </section>
              <section className="space-y-4">
                 <h3 className="text-xs font-black text-sky-900/40 uppercase tracking-widest">Recent Actions</h3>
                 {transactions.slice(0, 5).map(tx => (
                   <div key={tx.id} className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-sky-50 shadow-sm">
                      <div className="w-12 h-12 bg-sky-50 rounded-[1.2rem] flex items-center justify-center"><History className="w-5 h-5 text-sky-400" /></div>
                      <div className="flex-1"><h5 className="text-sm font-black">{tx.recipient}</h5><span className="text-[9px] font-bold text-sky-300 uppercase">{tx.type}</span></div>
                      <div className="text-right leading-none"><p className="text-sm font-black">৳{tx.amount}</p></div>
                   </div>
                 ))}
              </section>
            </motion.div>
          )}

          {activeTab === 'wallet' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="w" className="space-y-6">
              <div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest opacity-40">My Cards</h3><button onClick={handleAddCard}><Plus className="w-6 h-6" /></button></div>
              {cards.map(card => (
                 <div key={card.id} className="h-52 bg-sky-500 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between">
                   <div className="flex justify-between"><Wallet className="w-8 h-8" /><span className="text-xs font-black uppercase">{card.cardType}</span></div>
                   <p className="text-2xl font-mono tracking-widest">**** **** **** {card.cardNumberLast4}</p>
                   <div className="flex justify-between items-end"><div><p className="text-[9px] opacity-70 uppercase">Holder</p><p className="font-bold uppercase text-sm">{card.cardHolderName}</p></div><div className="text-right"><p className="text-[9px] opacity-70 uppercase">Expiry</p><p className="font-bold text-sm">{card.expiryDate}</p></div></div>
                 </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'explore' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="e" className="space-y-4">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-sky-50 shadow-sm">
                   <div className="w-12 h-12 bg-sky-50 rounded-[1.2rem] flex items-center justify-center"><History className="w-5 h-5 text-sky-400" /></div>
                   <div className="flex-1"><h5 className="text-sm font-black">{tx.recipient}</h5><span className="text-[9px] font-bold text-sky-300 uppercase">{tx.type}</span></div>
                   <div className="text-right leading-none"><p className="text-sm font-black">৳{tx.amount}</p></div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="p" className="space-y-8">
              <div className="bg-sky-50 p-8 rounded-[2.5rem] text-center space-y-4">
                <img src={currentUser.photoURL || ''} className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-xl" alt="p" />
                <h2 className="text-2xl font-black">{walletUser?.displayName}</h2>
                <button onClick={() => signOut(auth)} className="text-red-500 font-black text-sm uppercase tracking-widest flex items-center gap-2 mx-auto"><LogOut className="w-4 h-4" /> Sign Out</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
         <nav className="max-w-md mx-auto bg-white/90 backdrop-blur-md border border-sky-100 rounded-[2.5rem] p-2 flex items-center justify-between shadow-xl pointer-events-auto">
            <button onClick={() => setActiveTab('home')} className={`w-14 h-14 rounded-full flex items-center justify-center ${activeTab === 'home' ? 'bg-sky-400 text-white' : 'text-sky-200'}`}><Home className="w-6 h-6" /></button>
            <button onClick={() => setActiveTab('wallet')} className={`w-14 h-14 rounded-full flex items-center justify-center ${activeTab === 'wallet' ? 'bg-sky-400 text-white' : 'text-sky-200'}`}><CreditCard className="w-6 h-6" /></button>
            <div className="relative"><button className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center shadow-lg transform -translate-y-6"><QrCode className="w-8 h-8 text-white" /></button></div>
            <button onClick={() => setActiveTab('explore')} className={`w-14 h-14 rounded-full flex items-center justify-center ${activeTab === 'explore' ? 'bg-sky-400 text-white' : 'text-sky-200'}`}><History className="w-6 h-6" /></button>
            <button onClick={() => setActiveTab('profile')} className={`w-14 h-14 rounded-full flex items-center justify-center ${activeTab === 'profile' ? 'bg-sky-400 text-white' : 'text-sky-200'}`}><User className="w-6 h-6" /></button>
         </nav>
      </footer>

      {selectedFeature && (
        <div className="fixed inset-0 bg-sky-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 relative shadow-2xl">
            <button onClick={() => setSelectedFeature(null)} className="absolute top-8 right-8 text-sky-200"><X className="w-6 h-6" /></button>
            <h3 className="text-2xl font-black mb-6">{selectedFeature}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const amount = (e.currentTarget.elements.namedItem('amount') as HTMLInputElement).value;
              const recipient = (e.currentTarget.elements.namedItem('recipient') as HTMLInputElement).value;
              await handleTransaction(selectedFeature, parseFloat(amount), recipient);
            }} className="space-y-6">
              <input name="recipient" required placeholder="Mobile or Name" className="w-full p-4 bg-sky-50 rounded-2xl outline-none font-bold" />
              <input name="amount" type="number" required placeholder="0.00" className="w-full p-4 bg-sky-50 rounded-2xl outline-none font-black text-3xl" />
              <button type="submit" className="w-full bg-sky-400 text-white py-5 rounded-2xl font-black text-xl">Confirm</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
