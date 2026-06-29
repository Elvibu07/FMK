import React, { useState } from 'react';
import { updatePassword } from '../lib/auth';
import { ensureProfileExists } from '../lib/firestore';
import { auth } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';

interface CreateProfileModalProps {
  email: string;
  role: string;
  onClose: () => void;
  onSuccess?: (displayName: string) => void;
}

export default function CreateProfileModal({ email, role, onClose, onSuccess }: CreateProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      if (password) {
        await updatePassword(password);
      }

      if (displayName) {
        await updateProfile(user, { displayName });
      }

      await ensureProfileExists(role, user.uid, email, {
        displayName,
        name: displayName,
        telefono: phone,
        phone: phone,
        fechaNacimiento: birthDate,
        birthDate: birthDate
      });

      if (onSuccess) {
        onSuccess(displayName);
      }
    } catch (err) {
      console.error('Error creating profile:', err);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Crear perfil ({role})</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de nacimiento</label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white rounded">
              {isSaving ? 'Guardando...' : 'Crear perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
