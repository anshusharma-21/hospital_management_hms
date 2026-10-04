import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  Star,
  Send,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientFeedback = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [category, setCategory] = useState('Doctor Consultation');
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients/feedback');
      if (res.data?.success) {
        setFeedbacks(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load feedback records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      addToast('Please write your feedback or support query', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/patients/feedback', {
        category,
        rating,
        feedbackText: feedbackText.trim()
      });

      if (res.data?.success) {
        addToast('Thank you! Your feedback has been submitted to the patient relations team.', 'success');
        setFeedbackText('');
        setRating(5);
        fetchFeedbacks();
      } else {
        addToast(res.data?.error || 'Failed to submit feedback', 'error');
      }
    } catch (err) {
      console.error('Submit feedback error:', err);
      addToast(err.response?.data?.error || 'Failed to submit feedback. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Feedback & Support</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Share your hospital experience, report issues, or contact the patient care relations team
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Patient Relations Desk 24x7</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feedback Submission Form */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Submit Care Feedback or Query</h3>
              <p className="text-[11px] text-slate-500">Your ratings help us continuously improve hospital standards</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Feedback Department / Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="Doctor Consultation">Doctor Consultation & Clinical Care</option>
                <option value="Nursing Care">Nursing & Ward Attendance</option>
                <option value="Cleanliness / Hygiene">Hospital Cleanliness & Facilities</option>
                <option value="Billing & Cashier">Billing, Cashier & Insurance Desk</option>
                <option value="Lab / Diagnostics">Diagnostic Lab & Radiology Testing</option>
                <option value="Support Request">Patient Helpdesk / Support Request</option>
                <option value="General Feedback">General Experience & Suggestions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rate Your Experience
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Comments or Query Details
              </label>
              <textarea
                rows={4}
                required
                placeholder="Please describe your experience, praise care staff, or report any concern..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Feedback...' : 'Submit Feedback to Hospital'}</span>
            </button>
          </form>
        </div>

        {/* 24x7 Hospital Helpdesk & Contacts Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Care Support Desk</h3>
              <p className="text-[11px] text-slate-500">Instant patient helpline</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-1">
              <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">
                Emergency 24x7 Hotline
              </span>
              <p className="text-base font-black text-teal-950 font-mono flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-teal-600" />
                <span>+91 1800-200-4488</span>
              </p>
              <p className="text-[11px] text-slate-500 pt-0.5">Toll-free emergency ambulance & triage</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Patient Grievance Email
              </span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-teal-600" />
                <span>care@hospitalvision.com</span>
              </p>
              <p className="text-[11px] text-slate-500 pt-0.5">Response within 24 business hours</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Visiting Hours
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>10:00 AM – 12:00 PM & 05:00 PM – 07:00 PM</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-800">My Submitted Feedback & Inquiries ({feedbacks.length})</h3>

        {loading ? (
          <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
        ) : feedbacks.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            You haven't submitted any feedback yet. Your feedback helps us elevate clinical care.
          </p>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((item) => (
              <div
                key={item._id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] text-slate-400 font-mono ml-2">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 italic">
                  "{item.feedbackText}"
                </p>

                {item.response && (
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-900 mt-2">
                    <span className="font-bold block text-[11px] text-teal-800 mb-0.5">Hospital Response:</span>
                    <p className="text-[11px]">{item.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
