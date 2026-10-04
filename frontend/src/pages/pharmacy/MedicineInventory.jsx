import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  Edit3, 
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

export const MedicineInventory = () => {
  const { addToast } = useToast();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Drug Master State
  const [formData, setFormData] = useState({
    brandName: '',
    genericName: '',
    category: 'Antibiotics',
    dosageForm: 'Tablet',
    strength: '500 mg',
    manufacturer: 'Cipla Ltd',
    hsnCode: '3004',
    reorderLevel: 50,
    batchNumber: 'B-2026-01',
    expiryDate: '2027-12-31',
    mrp: 120,
    unitPrice: 95,
    quantity: 100
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacy/medicines');
      if (res.data.success) {
        setMedicines(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load medicine master', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        brandName: formData.brandName,
        genericName: formData.genericName,
        category: formData.category,
        dosageForm: formData.dosageForm,
        strength: formData.strength,
        manufacturer: formData.manufacturer,
        hsnCode: formData.hsnCode,
        reorderLevel: Number(formData.reorderLevel),
        batches: [
          {
            batchNumber: formData.batchNumber,
            expiryDate: formData.expiryDate,
            mrp: Number(formData.mrp),
            unitPrice: Number(formData.unitPrice),
            quantity: Number(formData.quantity)
          }
        ]
      };

      const res = await api.post('/pharmacy/medicines', payload);
      if (res.data.success) {
        addToast(`Medicine ${formData.brandName} added to drug master`, 'success');
        setShowAddModal(false);
        fetchMedicines();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to add medicine', 'error');
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Pharmacy Medicine Master & Batches</h1>
              <p className="text-xs text-slate-500">Drug master formulary, FEFO batch tracking, expiry dates & reorder level alerts</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchMedicines}>
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add New Medicine
          </Button>
        </div>
      </div>

      {/* Inventory Master Table */}
      <Card className="p-0 overflow-hidden border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Drug Formulary & Active Stock Batches</h2>
            <Badge variant="neutral">{filteredMedicines.length} Formulations</Badge>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search by brand, generic, category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Brand Name</TableHeader>
              <TableHeader>Generic Composition</TableHeader>
              <TableHeader>Category & Form</TableHeader>
              <TableHeader>Active Batches</TableHeader>
              <TableHeader>Total Stock</TableHeader>
              <TableHeader>MRP / Cost</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMedicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                  No medicines found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredMedicines.map((med) => {
                const totalStock = med.batches?.reduce((sum, b) => sum + (b.quantity || 0), 0) || 0;
                const isLow = totalStock <= (med.reorderLevel || 50);

                return (
                  <TableRow key={med._id}>
                    <TableCell>
                      <p className="font-bold text-slate-900 text-xs">{med.brandName}</p>
                      <p className="text-[10px] text-slate-400">{med.manufacturer}</p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">
                      {med.genericName}
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {med.dosageForm} • {med.strength}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{med.category}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {med.batches?.map((b, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-800">{b.batchNumber}</span>
                            <span className="text-slate-400">({b.quantity} qty)</span>
                            <span className="text-[10px] text-teal-700">Exp: {new Date(b.expiryDate).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono font-bold text-xs ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                        {totalStock} units
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-800">
                      ₹{med.batches?.[0]?.mrp || med.mrp || 100}
                    </TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="danger">Low Stock (≤{med.reorderLevel || 50})</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Medicine Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Add Formulation to Drug Master"
      >
        <form onSubmit={handleAddMedicine} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Brand Name</label>
              <Input 
                value={formData.brandName}
                onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                placeholder="e.g. Augmentin 625 Duo"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Generic Salt Name</label>
              <Input 
                value={formData.genericName}
                onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                placeholder="e.g. Amoxicillin + Clavulanic Acid"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Category</label>
              <Select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                options={[
                  { value: 'Antibiotics', label: 'Antibiotics' },
                  { value: 'Analgesics / NSAIDs', label: 'Analgesics / NSAIDs' },
                  { value: 'Cardiovascular', label: 'Cardiovascular' },
                  { value: 'Antidiabetic', label: 'Antidiabetic' },
                  { value: 'Gastrointestinal', label: 'Gastrointestinal' },
                  { value: 'Respiratory', label: 'Respiratory' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Dosage Form</label>
              <Select 
                value={formData.dosageForm}
                onChange={(e) => setFormData({...formData, dosageForm: e.target.value})}
                options={[
                  { value: 'Tablet', label: 'Tablet' },
                  { value: 'Capsule', label: 'Capsule' },
                  { value: 'Syrup / Suspension', label: 'Syrup / Suspension' },
                  { value: 'Injection / IV', label: 'Injection / IV' },
                  { value: 'Ointment', label: 'Ointment' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Strength</label>
              <Input 
                value={formData.strength}
                onChange={(e) => setFormData({...formData, strength: e.target.value})}
                placeholder="e.g. 625 mg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Manufacturer</label>
              <Input 
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                placeholder="e.g. GlaxoSmithKline"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Reorder Alert Level</label>
              <Input 
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Initial Batch Information */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Initial Batch Details</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Batch Number</label>
                <Input 
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Expiry Date</label>
                <Input 
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Initial Units</label>
                <Input 
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">MRP (₹)</label>
                <Input 
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => setFormData({...formData, mrp: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Cost / Unit (₹)</label>
                <Input 
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Formulation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
