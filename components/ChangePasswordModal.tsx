import React, { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { changePassword } from '../services/api';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, userId }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError("كلمتا المرور الجديدتان غير متطابقتين.");
            return;
        }
        if (newPassword.length < 8) {
            setError("يجب أن لا تقل كلمة المرور الجديدة عن 8 أحرف.");
            return;
        }

        setIsLoading(true);
        try {
            await changePassword(userId, currentPassword, newPassword);
            setSuccess("تم تغيير كلمة المرور بنجاح!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                onClose();
                setSuccess(null);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        // Reset state on close
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError(null);
        setSuccess(null);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="تغيير كلمة المرور">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    id="currentPassword"
                    label="كلمة المرور الحالية"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                />
                <Input
                    id="newPassword"
                    label="كلمة المرور الجديدة"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                />
                <Input
                    id="confirmPassword"
                    label="تأكيد كلمة المرور الجديدة"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                />

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
                
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="secondary" onClick={handleClose}>إلغاء</Button>
                    <Button type="submit" isLoading={isLoading}>تحديث كلمة المرور</Button>
                </div>
            </form>
        </Modal>
    );
};

export default ChangePasswordModal;