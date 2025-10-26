import React, { useState } from 'react';
import { User } from '../types';
import { loginUser, registerUser, forgotPasswordReset } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

interface LoginProps {
  onLogin: (user: User) => void;
}

const WhatsAppIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ms-2" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.655 4.398 1.919 6.22l-1.078 3.945 4.032-1.057zm4.521-7.14c-.276 0-.549.039-.81.118-.261.079-.496.164-.693.284-.197.12-.352.219-.462.318-.11.1-.21.176-.282. ২৩3-.072.057-.126.1-.141.118-.015.018-.044.057-.087.118-.043.061-.097.147-.146.257-.05.109-.092.228-.118.364-.026.136-.039.283-.039.439s.013.302.039.439c.026.136.066.26.118.373.051.113.109.213.176.299.067.086.141.164.221.233.081.069.166.13.257.184.09.054.182.097.276.129.094.032.193.051.291.062.099.011.203.016.304.016.182 0 .359-.026.524-.078.165-.052.32-.12.458-.204.138-.084.258-.175.352-.273.094-.098.166-.193.212-.284.046-.091.078-.173.094-.242.016-.07.023-.125.023-.164.001-.086-.01-.176-.035-.267-.024-.09-.061-.182-.111-.273-.05-.091-.115-.173-.193-.242-.078-.07-.168-.124-.264-.164-.096-.04-.2-.069-.304-.087-.104-.018-.213-.026-.32-.026zm-2.812 4.136c-.11-.057-.225-.13-.339-.219-.115-.089-.219-.204-.304-.34-.085-.136-.149-.299-.19-.488-.041-.189-.062-.399-.062-.626 0-.25.031-.488.094-.715.062-.227.152-.429.27-.601.118-.172.261-.318.423-.439.162-.12.344-.204.539-.253.195-.049.4-.073.606-.073.257 0 .502.035.729.102.227.067.433.164.612.284.179.12.329.266.443.439.114.172.193.373.236.592.043.219.065.456.065.703 0 .113-.005.227-.016.34-.011.113-.035.228-.072.34-.037.112-.086.223-.146.33-.061.107-.132.208-.212.304-.08.096-.171.182-.27.257-.099.075-.208.136-.323.183-.115.047-.235.078-.354.094-.119.016-.242.023-.365.023-.223 0-.44-.031-.646-.094-.206-.063-.399-.153-.573-.267z"/>
    </svg>
);

interface SuccessState {
    message: string;
    whatsAppUrl?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const clearForm = () => {
    setName('');
    setAddress('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  }

  const handleViewChange = (newView: 'login' | 'signup' | 'forgotPassword') => {
    clearForm();
    setView(newView);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (view === 'login') {
        const user = await loginUser(phoneNumber, password);
        onLogin(user);
      } else if (view === 'signup') {
        if (password.length < 8) {
            throw new Error("يجب أن لا تقل كلمة المرور عن 8 أحرف.");
        }
        if (password !== confirmPassword) {
            throw new Error("كلمتا المرور غير متطابقتين.");
        }
        await registerUser({ name, address, phoneNumber, password });
        setSuccess({ message: 'تم التسجيل بنجاح! الرجاء تسجيل الدخول.' });
        handleViewChange('login');
      } else if (view === 'forgotPassword') {
        const { user, tempPass } = await forgotPasswordReset(phoneNumber);
        const message = `مرحباً ${user.name}، كلمة المرور المؤقتة الجديدة لحسابك في جمعية تلوى للماء هي: ${tempPass}\n\nالرجاء تسجيل الدخول وتغيير كلمة المرور فوراً.`;
        const formattedPhone = user.phoneNumber.replace(/\D/g, '');
        const whatsAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        
        setSuccess({ 
            message: 'تم إنشاء كلمة مرور مؤقتة. انقر على الزر أدناه لإرسالها عبر واتساب.',
            whatsAppUrl: whatsAppUrl
        });
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const titles: Record<typeof view, string> = {
      login: 'مرحباً بعودتك!',
      signup: 'أنشئ حسابك',
      forgotPassword: 'إعادة تعيين كلمة المرور'
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card title={titles[view]}>
        {success && (view === 'login' || view === 'forgotPassword') && (
            <div className="text-sm mb-4 bg-green-50 p-3 rounded-md">
                <p className="text-green-800">{success.message}</p>
                {success.whatsAppUrl && (
                    <a 
                        href={success.whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                        <WhatsAppIcon /> إرسال عبر واتساب
                    </a>
                )}
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'signup' && (
            <>
              <Input id="name" label="الاسم الكامل" type="text" value={name} onChange={e => setName(e.target.value)} required />
              <Input id="address" label="العنوان" type="text" value={address} onChange={e => setAddress(e.target.value)} required />
            </>
          )}

          <Input id="phoneNumber" label="رقم الهاتف (مع الرمز الدولي)" type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))} placeholder="مثال: 212612345678" required />
          
          {view !== 'forgotPassword' && (
             <Input id="password" label="كلمة المرور" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          )}

          {view === 'forgotPassword' && (
            <p className="text-sm text-gray-600">
                أدخل رقم هاتفك. سنقوم بإنشاء كلمة مرور مؤقتة جديدة وتوفير رابط لإرسالها إلى واتساب الخاص بك.
            </p>
          )}

          {view === 'signup' && (
             <Input id="confirmPassword" label="تأكيد كلمة المرور" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          )}
          
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {view === 'login' && 'تسجيل الدخول'}
            {view === 'signup' && 'إنشاء حساب'}
            {view === 'forgotPassword' && 'إرسال كلمة مرور جديدة'}
          </Button>

          {view === 'login' && (
             <div className="text-left text-sm">
                 <button type="button" onClick={() => handleViewChange('forgotPassword')} className="font-medium text-primary hover:underline">
                    هل نسيت كلمة المرور؟
                 </button>
             </div>
          )}
        </form>
      </Card>

      <p className="text-center text-sm text-gray-500 mt-4">
        {view === 'login' && "ليس لديك حساب؟"}
        {view === 'signup' && "هل لديك حساب بالفعل؟"}
        {view === 'forgotPassword' && "هل تذكرت كلمة مرورك؟"}
        <button onClick={() => handleViewChange(view === 'login' ? 'signup' : 'login')} className="font-medium text-primary hover:underline ms-1">
          {view === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}
        </button>
      </p>
    </div>
  );
};

export default Login;