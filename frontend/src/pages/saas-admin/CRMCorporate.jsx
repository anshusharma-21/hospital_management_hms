import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp 
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

export const CRMCorporate = () => {
  const { addToast } = useToast();
  const [leads, setLeads] = useState([]);
  const [corporateAccounts, setCorporateAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads');
  const [showLeadModal, setShowLeadModal] = useState(false);

  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    hospitalName: '',
    bedCount: 50,
    status: 'new',
    notes: ''
  });

  useEffect(() => {
    fetchCrmData();
  }, []);

  const fetchCrmData = async () => {
    setLoading(true);
    try {
      const [leadsRes, corpRes] = await Promise.all([
        api.get('/saas/crm'),
        api.get('/saas/corporate-accounts')
      ]);

      if (leadsRes.data.success) {
        setLeads(leadsRes.data.data);
      }
      if (corpRes.data.success) {
        setCorporateAccounts(corpRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setLeads([]);
      setCorporateAccounts([]);
      addToast('Failed to load CRM records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/saas/crm', leadForm);
      if (res.data.success) {
        addToast(`Lead for ${leadForm.hospitalName} logged!`, 'success');
        setShowLeadModal(false);
        fetchCrmData();
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to create lead', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">CRM & Corporate Accounts Desk</h1>
              <p className="text-xs text-slate-500">Hospital Vision enterprise prospective sales pipeline and corporate empanelled health accounts</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowLeadModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Log Hospital Lead
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'leads'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Prospective Hospital Leads ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab('corporate')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'corporate'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Empanelled Corporate Accounts ({corporateAccounts.length})
        </button>
      </div>

      {activeTab === 'leads' ? (
        <Card className="p-0 overflow-hidden border-slate-200">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Hospital / Clinic Name</TableHeader>
                <TableHeader>Contact Doctor / Director</TableHeader>
                <TableHeader>Bed Count</TableHeader>
                <TableHeader>Contact Details</TableHeader>
                <TableHeader>Pipeline Stage</TableHeader>
                <TableHeader>Notes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((l, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-slate-900 text-xs">{l.hospitalName}</TableCell>
                  <TableCell className="text-xs text-slate-800 font-semibold">{l.name}</TableCell>
                  <TableCell className="font-mono text-xs text-teal-700 font-bold">{l.bedCount} Beds</TableCell>
                  <TableCell>
                    <p className="text-xs text-slate-700">{l.email}</p>
                    <p className="font-mono text-[11px] text-slate-400">{l.phone}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.status === 'demo_scheduled' ? 'info' : 'warning'}>
                      {l.status?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate">{l.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-slate-200">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Corporate Organization</TableHeader>
                <TableHeader>Contact Manager</TableHeader>
                <TableHeader>Contact Coordinates</TableHeader>
                <TableHeader>Credit Limit</TableHeader>
                <TableHeader>Agreed Tariff Discount</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {corporateAccounts.map((c, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-slate-900 text-xs">{c.companyName}</TableCell>
                  <TableCell className="text-xs text-slate-800 font-semibold">{c.contactPerson}</TableCell>
                  <TableCell>
                    <p className="text-xs text-slate-700">{c.email}</p>
                    <p className="font-mono text-[11px] text-slate-400">{c.phone}</p>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs text-teal-700">₹{c.creditLimit?.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-800">{c.discountPercentage}% Off Standard Tariff</TableCell>
                  <TableCell>
                    <Badge variant="success">Active Partner</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Log Lead Modal */}
      <Modal 
        isOpen={showLeadModal} 
        onClose={() => setShowLeadModal(false)}
        title="Log Prospective Hospital Lead"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Hospital / Clinic Name</label>
              <Input 
                value={leadForm.hospitalName}
                onChange={(e) => setLeadForm({...leadForm, hospitalName: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Key Decision Maker Name</label>
              <Input 
                value={leadForm.name}
                onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <Input 
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <Input 
                value={leadForm.phone}
                onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Estimated Bed Capacity</label>
              <Input 
                type="number"
                value={leadForm.bedCount}
                onChange={(e) => setLeadForm({...leadForm, bedCount: Number(e.target.value)})}
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Stage</label>
              <Select 
                value={leadForm.status}
                onChange={(e) => setLeadForm({...leadForm, status: e.target.value})}
                options={[
                  { value: 'new', label: 'New Inquiry' },
                  { value: 'demo_scheduled', label: 'Product Demo Scheduled' },
                  { value: 'proposal_sent', label: 'Commercial Proposal Sent' },
                  { value: 'negotiation', label: 'In Commercial Negotiations' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Requirements & Notes</label>
            <textarea 
              rows={2}
              value={leadForm.notes}
              onChange={(e) => setLeadForm({...leadForm, notes: e.target.value})}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowLeadModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Lead
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
