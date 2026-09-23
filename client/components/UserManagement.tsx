
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Trash2, Mail, Shield, Briefcase, UserPlus, X, Check, Lock, Eye, EyeOff, User as UserIcon, Phone, Edit2 } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const initialFormState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: UserRole.CONTRIBUTOR,
    department: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingUser) {
      setFormData({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        phone: editingUser.phone,
        username: editingUser.username,
        password: editingUser.password || '',
        role: editingUser.role,
        department: editingUser.department || ''
      });
      setShowModal(true);
    } else {
      setFormData(initialFormState);
    }
  }, [editingUser]);

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.username || !formData.password || !formData.phone) {
      alert("Tous les champs obligatoires doivent être remplis.");
      return;
    }

    if (editingUser) {
      const updatedUser: User = {
        ...editingUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        department: formData.department
      };
      onUpdateUser(updatedUser);
    } else {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        avatar: `https://i.pravatar.cc/150?u=${formData.username}`,
        role: formData.role,
        department: formData.department
      };
      onAddUser(newUser);
    }

    handleCloseModal();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">Gestion de l'équipe</h1>
          <p className="text-inksoft font-medium">Administration système : contrôle total des accès et des rôles.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditingUser(null); setShowModal(true); }}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer un utilisateur</span>
          </button>
        )}
      </div>

      <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface2 border-b border-linesoft">
              <th className="px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Utilisateur / Username</th>
              <th className="px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Rôle</th>
              <th className="px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider">Département</th>
              <th className="px-6 py-4 text-xs font-bold text-inkmuted uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linesoft">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-indigo-50/10 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img src={user.avatar} className="w-10 h-10 rounded-full ring-2 ring-linesoft" alt={user.name} />
                    <div>
                      <p className="font-bold text-sm text-ink">{user.firstName} {user.lastName.toUpperCase()}</p>
                      <div className="flex items-center text-xs text-brand font-bold">
                        <UserIcon className="w-3 h-3 mr-1" />
                        @{user.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-inksoft">
                      <Mail className="w-3 h-3 mr-2" />
                      {user.email}
                    </div>
                    <div className="flex items-center text-xs text-inksoft">
                      <Phone className="w-3 h-3 mr-2" />
                      {user.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                    user.role === UserRole.ADMIN ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-100' :
                    user.role === UserRole.MANAGER ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-100' :
                    'bg-surface2 text-inksoft border-linesoft'
                  }`}>
                    <Shield className="w-3 h-3 mr-1.5" />
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm font-medium text-inksoft">
                    <Briefcase className="w-4 h-4 mr-2 text-inkmuted" />
                    {user.department || 'Non spécifié'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAdmin && (
                      <button 
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-inkmuted hover:text-brand hover:bg-brandsoft rounded-lg transition-all"
                        title="Modifier l'utilisateur"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && user.id !== currentUser.id && (
                      <button 
                        onClick={() => onDeleteUser(user.id)}
                        className="p-2 text-inkmuted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        title="Révoquer l'accès"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {user.id === currentUser.id && (
                    <span className="text-xs font-bold text-indigo-400 italic">Administrateur Actif</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-linesoft flex items-center justify-between bg-surface2">
              <div>
                <h3 className="text-xl font-bold text-ink tracking-tight">
                  {editingUser ? 'Modifier le compte' : 'Nouveau compte utilisateur'}
                </h3>
                <p className="text-xs text-inksoft font-medium">Standard d'identification ZenTask Pro</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-inkmuted hover:text-inksoft hover:bg-surface2 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-inkmuted uppercase tracking-wide mb-2 ml-1">Prénom</label>
                    <input 
                      required
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      placeholder="Jean"
                      className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-inkmuted uppercase tracking-wide mb-2 ml-1">Nom</label>
                    <input 
                      required
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Dupont"
                      className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-inkmuted uppercase tracking-wide mb-2 ml-1">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmuted" />
                      <input 
                        required
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase()})}
                        placeholder="jdupont"
                        className="w-full bg-surface2 border border-line rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-inkmuted uppercase tracking-wide mb-2 ml-1">Mot de passe</label>
                    <div className="relative">
                      <input 
                        required
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 pl-10 text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmuted" />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-inkmuted hover:text-brand transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-inkmuted uppercase tracking-wide mb-2 ml-1">Email</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="jean@zentask.pro"
                      className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-inkmuted uppercase tracking-wide mb-2 ml-1">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-inkmuted" />
                      <input 
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="06 01 02 03 04"
                        className="w-full bg-surface2 border border-line rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-inkmuted uppercase tracking-wide mb-2 ml-1">Rôle</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                      className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value={UserRole.CONTRIBUTOR}>Contributeur</option>
                      <option value={UserRole.MANAGER}>Manager</option>
                      <option value={UserRole.ADMIN}>Administrateur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-inkmuted uppercase tracking-wide mb-2 ml-1">Département</label>
                    <input 
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      placeholder="Marketing"
                      className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-4 border border-line text-inksoft font-bold text-sm rounded-2xl hover:bg-surface2 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-2 bg-indigo-600 text-white font-bold text-sm rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 px-10"
                >
                  <Check className="w-5 h-5" />
                  {editingUser ? 'Enregistrer les modifications' : 'Valider la création'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
