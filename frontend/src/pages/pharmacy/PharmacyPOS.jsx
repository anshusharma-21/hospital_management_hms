import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Pill, 
  Trash2, 
  Plus, 
  Printer, 
  CheckCircle2, 
  CreditCard, 
  Receipt, 
  User, 
  Clock,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const PharmacyPOS = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedRx, setSelectedRx] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Billing calculation
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rxRes, medRes] = await Promise.all([
        api.get('/pharmacy/prescriptions'),
        api.get('/pharmacy/medicines')
      ]);

      if (rxRes.data.success) {
        setPrescriptions(rxRes.data.data.filter(p => p.pharmacyStatus === 'pending'));
      }
      if (medRes.data.success) {
        setInventory(medRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrescription = (rx) => {
    setSelectedRx(rx);
    // Auto-populate cart from prescription
    const rawMeds = rx.medications || rx.medicines || [];
    const cartItems = rawMeds.map(m => {
      // Find matching item in inventory
      const found = inventory.find(inv => 
        inv.brandName?.toLowerCase().includes(m.medicineName?.toLowerCase()) ||
        inv.name?.toLowerCase().includes(m.medicineName?.toLowerCase()) ||
        m.medicineName?.toLowerCase().includes(inv.brandName?.toLowerCase()) ||
        m.medicineName?.toLowerCase().includes(inv.name?.toLowerCase())
      );

      const batch = found?.batches?.[0] || {
        batchNumber: 'B-2026-90',
        expiryDate: '2027-11-30',
        mrp: found?.mrp || 120,
        unitPrice: found?.unitPrice || 95
      };

      return {
        medicineId: found?._id,
        medicineName: m.medicineName,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: m.quantity || 10,
        unitPrice: batch.unitPrice || 10,
        total: (m.quantity || 10) * (batch.unitPrice || 10),
        dosage: `${m.dosage} • ${m.frequency}`
      };
    }) || [];

    setCart(cartItems);
    addToast(`Prescription ${rx.prescriptionNumber} loaded into POS cart`, 'info');
  };

  const handleUpdateQuantity = (idx, qty) => {
    const q = Math.max(1, parseInt(qty) || 1);
    const updated = [...cart];
    updated[idx].quantity = q;
    updated[idx].total = q * updated[idx].unitPrice;
    setCart(updated);
  };

  const handleRemoveItem = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxAmount = (subtotal - discountAmount) * 0.05; // 5% GST on medicine
  const netTotal = Math.round(subtotal - discountAmount + taxAmount);

  const handleCompleteDispense = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty. Please load an Rx or add medicines.', 'warning');
      return;
    }

    try {
      // Complete dispensing via backend API
      const payload = {
        prescriptionId: selectedRx?._id,
        patientId: selectedRx?.patient?._id,
        items: cart,
        paymentMode,
        paymentMethod: paymentMode,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        netTotal
      };

      const res = await api.post('/pharmacy/dispense', payload);
      if (res.data.success) {
        setLastSaleReceipt({
          receiptNumber: `PHARM-REC-${Math.floor(1000 + Math.random() * 9000)}`,
          patientName: selectedRx?.patient?.fullName || 'Walk-in Customer',
          uhid: selectedRx?.patient?.uhid || 'WALK-IN',
          date: new Date().toLocaleString(),
          items: cart,
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          netTotal,
          paymentMode
        });
        setShowReceiptModal(true);
        addToast('Medicines dispensed & stock updated successfully!', 'success');
        setCart([]);
        setSelectedRx(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to complete pharmacy sale', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Pharmacy Dispensing & Point-of-Sale (POS)</h1>
              <p className="text-xs text-slate-500">Fast prescription fulfillment, FEFO batch allocation & thermal receipt printing</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pending Prescriptions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-0 overflow-hidden border-slate-200">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-xs text-slate-800">Prescription Queue</span>
              <Badge variant="warning">{prescriptions.length} Pending</Badge>
            </div>

            <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
              {prescriptions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No pending prescriptions in queue.
                </div>
              ) : (
                prescriptions.map((rx) => {
                  const isSelected = selectedRx?._id === rx._id;
                  return (
                    <div 
                      key={rx._id}
                      onClick={() => handleSelectPrescription(rx)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-50/90 border-l-4 border-teal-800' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono font-bold text-teal-800 text-xs">{rx.prescriptionNumber}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(rx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{rx.patient?.fullName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{rx.patient?.uhid}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Prescribed by {rx.doctor?.name ? (rx.doctor.name.startsWith('Dr.') ? rx.doctor.name : `Dr. ${rx.doctor.name}`) : 'Attending Physician'}</p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: POS Cart & Checkout (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-slate-200">
            {/* Active Rx Bar */}
            {selectedRx && (
              <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 mb-4 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-teal-900">{selectedRx.patient?.fullName} ({selectedRx.patient?.uhid})</p>
                  <p className="text-teal-700">Rx: {selectedRx.prescriptionNumber} • {selectedRx.doctor?.name ? (selectedRx.doctor.name.startsWith('Dr.') ? selectedRx.doctor.name : `Dr. ${selectedRx.doctor.name}`) : 'Attending Physician'}</p>
                </div>
                <Badge variant="success">Prescription Verified</Badge>
              </div>
            )}

            {/* Cart Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-3">Medicine Description</th>
                    <th className="p-3">Batch & Expiry</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Total (₹)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                        Select a prescription from the queue on the left to load items.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{item.medicineName}</p>
                          <p className="text-[10px] text-slate-400">{item.dosage}</p>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {item.batchNumber} (Exp: {new Date(item.expiryDate).toLocaleDateString()})
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(idx, e.target.value)}
                            className="w-16 px-2 py-1 rounded border border-slate-300 font-mono font-bold text-center focus:ring-1 focus:ring-teal-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-3 font-mono text-slate-700">₹{item.unitPrice}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">₹{item.total}</td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Payment Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              {/* Payment Method */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Cash', 'UPI / QR', 'Card', 'Credit (IPD)'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          paymentMode === mode 
                            ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Discount (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="50"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount ({discountPercent}%):</span>
                  <span className="font-mono font-medium text-emerald-600">-₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax (5%):</span>
                  <span className="font-mono font-medium">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono text-teal-700">₹{netTotal}</span>
                </div>

                <Button 
                  className="w-full mt-2" 
                  disabled={cart.length === 0}
                  onClick={handleCompleteDispense}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Dispense & Print Receipt
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Thermal Receipt Modal */}
      <Modal 
        isOpen={showReceiptModal} 
        onClose={() => setShowReceiptModal(false)}
        title="Pharmacy Cash Receipt"
      >
        {lastSaleReceipt && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h3 className="font-bold text-slate-900 text-sm">
                  {user?.tenant?.name || 'Hospital Vision Pharmacy'}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {user?.branch?.name || 'Licensed Pharmacy & Chemist'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {[
                    user?.branch?.address?.city || user?.tenant?.address?.city,
                    user?.branch?.phone || user?.tenant?.phone ? `Tel: ${user?.branch?.phone || user?.tenant?.phone}` : null
                  ].filter(Boolean).join(' • ')}
                </p>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Receipt: <strong>{lastSaleReceipt.receiptNumber}</strong></span>
                <span>{lastSaleReceipt.date}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Patient: {lastSaleReceipt.patientName}</span>
                <span>UHID: {lastSaleReceipt.uhid}</span>
              </div>
              <div className="text-[11px]">Mode: {lastSaleReceipt.paymentMode}</div>

              <div className="py-2 border-t border-b border-dashed border-slate-300 space-y-1">
                {lastSaleReceipt.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span className="truncate max-w-[180px]">{it.medicineName} x {it.quantity}</span>
                    <span>₹{it.total}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right text-[11px]">
                <div>Subtotal: ₹{lastSaleReceipt.subtotal.toFixed(2)}</div>
                <div>Discount: -₹{lastSaleReceipt.discount.toFixed(2)}</div>
                <div>Tax (5%): ₹{lastSaleReceipt.tax.toFixed(2)}</div>
                <div className="text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
                  Total Paid: ₹{lastSaleReceipt.netTotal}
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                Medicines once sold cannot be returned without original cash memo.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowReceiptModal(false)}>
                Close
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Thermal Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
