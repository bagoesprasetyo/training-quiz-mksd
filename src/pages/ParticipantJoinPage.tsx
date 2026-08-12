import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building, IdCard, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { PinInput } from '../components/ui/PinInput';
import { supabase } from '../services/supabase';

export const ParticipantJoinPage: React.FC = () => {
  const { sessionId: paramPin } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();

  const [pinCode, setPinCode] = useState(paramPin || '');
  const [step, setStep] = useState<'pin' | 'details'>(paramPin ? 'details' : 'pin');
  
  const [nickname, setNickname] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');

  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paramPin) {
      validatePin(paramPin);
    }
  }, [paramPin]);

  const validatePin = async (pin: string) => {
    try {
      setLoading(true);
      setError('');

      const { data: session, error: sessionErr } = await supabase
        .from('live_sessions')
        .select('*, quizzes(title)')
        .eq('pin_code', pin)
        .single();

      if (sessionErr || !session) {
        setError('Invalid PIN code or session expired. Please check and try again.');
        setStep('pin');
        setLoading(false);
        return;
      }

      if (session.status === 'finished') {
        setError('This live quiz session has already finished.');
        setStep('pin');
        setLoading(false);
        return;
      }

      setSessionData(session);
      setPinCode(pin);
      setStep('details');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to session');
      setLoading(false);
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (!sessionData) {
        // Fetch session by PIN if not loaded
        const { data: session } = await supabase
          .from('live_sessions')
          .select('id, status')
          .eq('pin_code', pinCode)
          .single();
        if (!session) {
          setError('Session not found.');
          setLoading(false);
          return;
        }
        setSessionData(session);
      }

      // Insert participant into DB
      const { data: participant, error: joinErr } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionData.id,
          nickname: nickname.trim(),
          employee_id: employeeId.trim() || null,
          department: department.trim() || null,
          is_online: true,
        })
        .select()
        .single();

      if (joinErr) {
        if (joinErr.code === '23505') { // Unique constraint violation (duplicate nickname)
          setError('This name is already taken in this session. Please use another name.');
        } else {
          setError(joinErr.message || 'Failed to join session');
        }
        setLoading(false);
        return;
      }

      // Save participant info in sessionStorage
      sessionStorage.setItem('participant_info', JSON.stringify(participant));

      // Navigate to live session view for participant
      navigate(`/session/${sessionData.id}`);
    } catch (err: any) {
      setError(err.message || 'Error joining session');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-white">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass-panel border-2 border-slate-200/80 p-6 sm:p-8 shadow-elevated">
          
          {/* Header Branding */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0000FF] text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {step === 'pin' ? 'Enter Quiz PIN' : 'Join Training Session'}
            </h2>
            {sessionData?.quizzes?.title && (
              <p className="text-sm font-bold text-[#0000FF] bg-blue-50 py-1 px-3 rounded-lg inline-block">
                Quiz: {sessionData.quizzes.title}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: ENTER PIN */}
          {step === 'pin' && (
            <div className="space-y-4">
              <p className="text-xs text-center text-slate-500 font-medium">
                Enter the 6-digit PIN code displayed on the trainer screen
              </p>
              
              <PinInput 
                onComplete={(pin) => validatePin(pin)}
                isLoading={loading}
              />

              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-slate-500 text-xs"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </div>
          )}

          {/* STEP 2: ENTER PARTICIPANT DETAILS */}
          {step === 'details' && (
            <form onSubmit={handleJoinSession} className="space-y-4">
              <Input
                label="Your Full Name / Nickname *"
                placeholder="e.g. Budi Santoso"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="Employee ID / NIK (Optional)"
                placeholder="e.g. EMP-1049"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                leftIcon={<IdCard className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="Department / Unit (Optional)"
                placeholder="e.g. Production / Quality Assurance"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                leftIcon={<Building className="w-4 h-4 text-slate-400" />}
              />

              <div className="pt-2 space-y-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  className="w-full font-extrabold text-base py-3.5 shadow-lg shadow-blue-500/20"
                  isLoading={loading}
                >
                  JOIN QUIZ NOW
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-slate-400 text-xs"
                  onClick={() => setStep('pin')}
                >
                  Change PIN Code ({pinCode})
                </Button>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
