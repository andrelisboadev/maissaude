import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Stethoscope,
  Building2,
  UserCheck,
  Shield,
  Key,
  Mail,
  Phone,
  Check,
  Copy,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Calendar,
  DollarSign,
  Clock,
  ChevronRight,
} from "lucide-react";
import { ClinicUser, ServiceItem } from "../types";
import { soundEffects } from "../utils/audioEffects";
import { supabase } from "../lib/supabase";

interface UserManagementProps {
  users: ClinicUser[];
  services: ServiceItem[];
  currentRole: "admin" | "doctor" | "receptionist";
  onSaveUser: (user: ClinicUser, newService?: ServiceItem) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onLoginAsUser: (user: ClinicUser) => void;
  onNavigateTab: (tab: any) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  services,
  currentRole,
  onSaveUser,
  onDeleteUser,
  onLoginAsUser,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "doctor" | "receptionist" | "admin">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formRole, setFormRole] = useState<"doctor" | "receptionist" | "admin">("doctor");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPin, setFormPin] = useState("1234");
  const [formAvatarUrl, setFormAvatarUrl] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");

  // Doctor specific form fields
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [isCreatingNewDoctorService, setIsCreatingNewDoctorService] = useState(false);
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState("");
  const [newDoctorCrm, setNewDoctorCrm] = useState("");
  const [newDoctorPrice, setNewDoctorPrice] = useState("220");
  const [newDoctorDuration, setNewDoctorDuration] = useState("30");
  const [newDoctorStartHour, setNewDoctorStartHour] = useState("08:00");
  const [newDoctorEndHour, setNewDoctorEndHour] = useState("18:00");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPinId, setShowPinId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filtered Users
  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.crm && user.crm.toLowerCase().includes(term)) ||
      (user.specialty && user.specialty.toLowerCase().includes(term)) ||
      (user.phone && user.phone.toLowerCase().includes(term));
    return matchesRole && matchesSearch;
  });

  const doctorsCount = users.filter((u) => u.role === "doctor" && u.status === "active").length;
  const receptionCount = users.filter((u) => u.role === "receptionist" && u.status === "active").length;
  const adminCount = users.filter((u) => u.role === "admin" && u.status === "active").length;

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setAvatarUploadError("Selecione um arquivo de imagem (JPG, PNG, etc).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarUploadError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarUploadError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${editingUserId || "novo"}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("whatsapp_ia_avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("whatsapp_ia_avatars").getPublicUrl(path);
      setFormAvatarUrl(data.publicUrl);
      soundEffects.playPaymentSuccess();
    } catch (err: any) {
      console.error("Erro ao enviar foto:", err);
      setAvatarUploadError("Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleOpenAddModal = (defaultRole?: "doctor" | "receptionist" | "admin") => {
    setEditingUserId(null);
    const targetRole = defaultRole || "doctor";
    setFormRole(targetRole);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPin(Math.floor(1000 + Math.random() * 9000).toString());
    setFormAvatarUrl("");
    setAvatarUploadError("");
    setFormStatus("active");
    setSelectedServiceId(services[0]?.id || "");
    setIsCreatingNewDoctorService(false);
    setNewDoctorSpecialty("");
    setNewDoctorCrm("");
    setNewDoctorPrice("220");
    setNewDoctorDuration("30");
    setNewDoctorStartHour("08:00");
    setNewDoctorEndHour("18:00");
    setIsModalOpen(true);
    soundEffects.playClick();
  };

  const handleOpenEditModal = (user: ClinicUser) => {
    setEditingUserId(user.id);
    setFormRole(user.role);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone || "");
    setFormPin(user.pin || "1234");
    setFormAvatarUrl(user.avatarUrl || "");
    setAvatarUploadError("");
    setFormStatus(user.status);
    setSelectedServiceId(user.doctorId || "");
    setIsCreatingNewDoctorService(false);
    setNewDoctorSpecialty(user.specialty || "");
    setNewDoctorCrm(user.crm || "");
    setIsModalOpen(true);
    soundEffects.playClick();
  };

  const handleSelectServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (serviceId === "__NEW__") {
      setIsCreatingNewDoctorService(true);
    } else {
      setIsCreatingNewDoctorService(false);
      const svc = services.find((s) => s.id === serviceId);
      if (svc && !editingUserId) {
        setFormName(svc.doctor);
        setNewDoctorCrm(svc.crm || "");
        setNewDoctorSpecialty(svc.name);
        const emailSlug = svc.doctor
          .toLowerCase()
          .replace(/^(dr\.|dra\.)\s*/i, "")
          .trim()
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9.]/g, "");
        setFormEmail(`${emailSlug}@santaclara.com.br`);
      }
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Por favor, preencha o nome do usuário.");
      return;
    }

    setIsSaving(true);
    try {
      let doctorId = selectedServiceId;
      let doctorName = formName;
      let specialty = newDoctorSpecialty;
      let crm = newDoctorCrm;
      let createdService: ServiceItem | undefined = undefined;

      if (formRole === "doctor") {
        if (isCreatingNewDoctorService || selectedServiceId === "__NEW__") {
          const serviceSlug = (newDoctorSpecialty || "especialidade")
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
          const newSvcId = `med-${serviceSlug}-${Date.now().toString().slice(-4)}`;
          
          createdService = {
            id: newSvcId,
            name: newDoctorSpecialty || `Consulta com ${formName}`,
            category: "Especialidades",
            price: parseFloat(newDoctorPrice) || 220,
            durationMinutes: parseInt(newDoctorDuration) || 30,
            description: `Atendimento especializado com ${formName}`,
            doctor: formName,
            crm: newDoctorCrm || "CRM/PA",
            specialtyDetails: `Especialista em ${newDoctorSpecialty || "atendimento clínico"}`,
            availableDays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
            workStartHour: newDoctorStartHour || "08:00",
            workEndHour: newDoctorEndHour || "18:00",
          };
          doctorId = newSvcId;
          doctorName = formName;
          specialty = newDoctorSpecialty;
          crm = newDoctorCrm;
        } else if (selectedServiceId) {
          const existingSvc = services.find((s) => s.id === selectedServiceId);
          if (existingSvc) {
            doctorId = existingSvc.id;
            doctorName = formName || existingSvc.doctor;
            specialty = existingSvc.name;
            crm = newDoctorCrm || existingSvc.crm || "CRM/PA";
          }
        }
      }

      const generatedEmail =
        formEmail.trim() ||
        `${formName
          .toLowerCase()
          .replace(/^(dr\.|dra\.)\s*/i, "")
          .trim()
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9.]/g, "")}@santaclara.com.br`;

      const userToSave: ClinicUser = {
        id: editingUserId || `usr-${formRole}-${Date.now()}`,
        name: formName.trim(),
        email: generatedEmail,
        role: formRole,
        doctorId: formRole === "doctor" ? doctorId : undefined,
        doctorName: formRole === "doctor" ? doctorName : undefined,
        crm: formRole === "doctor" ? crm : undefined,
        specialty: formRole === "doctor" ? specialty : undefined,
        phone: formPhone.trim() || undefined,
        pin: formPin.trim() || "1234",
        avatarUrl: formAvatarUrl || undefined,
        status: formStatus,
        createdAt: editingUserId ? (users.find((u) => u.id === editingUserId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        lastLogin: editingUserId ? users.find((u) => u.id === editingUserId)?.lastLogin : undefined,
      };

      await onSaveUser(userToSave, createdService);

      // Convite de login real (só para usuários NOVOS — edições não reenviam convite)
      if (!editingUserId) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          if (accessToken) {
            const inviteRes = await fetch("/api/admin/invite-staff", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({ email: userToSave.email, clinicUserId: userToSave.id }),
            });
            if (!inviteRes.ok) {
              const err = await inviteRes.json().catch(() => ({}));
              console.warn("Convite de login não enviado:", err.error);
            }
          }
        } catch (inviteErr) {
          console.warn("Falha ao enviar convite de login:", inviteErr);
        }
      }

      soundEffects.playPaymentSuccess();
      setIsModalOpen(false);
      setFeedbackMessage(
        editingUserId
          ? `Usuário ${userToSave.name} atualizado com sucesso!`
          : `Novo ${userToSave.role === "doctor" ? "médico" : "usuário"} ${userToSave.name} cadastrado! Um e-mail de convite para criar a senha de acesso foi enviado para ${userToSave.email}.`
      );
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err);
      alert("Erro ao salvar usuário. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja remover o acesso de ${userName}?`)) {
      soundEffects.playClick();
      await onDeleteUser(userId);
      setFeedbackMessage(`Acesso de ${userName} removido com sucesso.`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const handleCopyCredentials = (user: ClinicUser) => {
    const text = `🏥 *Acesso ao Sistema Santa Clara*\n👤 Nome: ${user.name}\n🔑 Perfil: ${
      user.role === "doctor" ? `Médico (${user.specialty || "Especialista"})` : user.role === "admin" ? "Administrador Geral" : "Recepção / Balcão"
    }\n📧 Login: ${user.email}\n🔒 Senha/PIN: ${user.pin || "1234"}\n\n🌐 Link de Acesso Direto:\n${window.location.origin}/?role=${user.role}${user.doctorId ? `&doctor=${user.doctorId}` : ""}`;

    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    soundEffects.playClick();
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Gestão de Equipe, Médicos & Usuários
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Controle de acessos, criação de logins para cada médico, recepcionista e administradores da clínica.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenAddModal("doctor")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all active:scale-98"
          >
            <Stethoscope className="w-4 h-4" />
            <span>+ Cadastrar Médico</span>
          </button>

          <button
            onClick={() => handleOpenAddModal("receptionist")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Novo Usuário Recepção</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total de Usuários</div>
            <div className="text-xl font-black text-slate-900">{users.length} membros</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Médicos Ativos</div>
            <div className="text-xl font-black text-emerald-700">{doctorsCount} profissionais</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Recepção & Balcão</div>
            <div className="text-xl font-black text-blue-700">{receptionCount} atendentes</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Administradores</div>
            <div className="text-xl font-black text-purple-700">{adminCount} diretores</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CRM, email ou especialidade..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              roleFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter("doctor")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
              roleFilter === "doctor"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Médicos ({doctorsCount})</span>
          </button>
          <button
            onClick={() => setRoleFilter("receptionist")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
              roleFilter === "receptionist"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Recepção ({receptionCount})</span>
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
              roleFilter === "admin"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin ({adminCount})</span>
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isDoc = user.role === "doctor";
          const isAdmin = user.role === "admin";
          const isRecep = user.role === "receptionist";
          const isShowingPin = showPinId === user.id;
          const isCopied = copiedId === user.id;

          return (
            <div
              key={user.id}
              className={`bg-white rounded-3xl border p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between relative ${
                user.status === "inactive"
                  ? "border-slate-200 opacity-60 bg-slate-50/50"
                  : isDoc
                  ? "border-emerald-100 hover:border-emerald-300"
                  : isAdmin
                  ? "border-purple-100 hover:border-purple-300"
                  : "border-blue-100 hover:border-blue-300"
              }`}
            >
              <div>
                {/* Header card info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                        isDoc
                          ? "bg-emerald-600 text-white"
                          : isAdmin
                          ? "bg-purple-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {user.name.replace(/^(dr\.|dra\.)\s*/i, "").charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDoc
                              ? "bg-emerald-100 text-emerald-800"
                              : isAdmin
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isDoc ? "Médico Especialista" : isAdmin ? "Administrador Geral" : "Recepção / Atendente"}
                        </span>
                        {user.status === "active" ? (
                          <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Inativo</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Edit */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      title="Editar usuário"
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {user.id !== "usr-admin-1" && (
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        title="Remover usuário"
                        className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Doctor Details (CRM & Specialty) */}
                {isDoc && (
                  <div className="p-2.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 mb-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-950">
                      <span className="text-emerald-700">Especialidade:</span>
                      <span className="font-bold">{user.specialty || "Clínica Médica"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-950">
                      <span className="text-emerald-700">Registro Profissional:</span>
                      <span className="font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded text-emerald-900 text-[10px] font-bold">
                        {user.crm || "CRM 12345/PA"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contact & Login Details */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate font-medium text-slate-700">{user.email}</span>
                  </div>

                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-700">{user.phone}</span>
                    </div>
                  )}

                  {/* PIN Section */}
                  <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span>PIN de Acesso:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {isShowingPin ? user.pin || "1234" : "••••"}
                      </span>
                      <button
                        onClick={() => setShowPinId(isShowingPin ? null : user.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                      >
                        {isShowingPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onLoginAsUser(user)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs text-white ${
                    isDoc
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : isAdmin
                      ? "bg-purple-600 hover:bg-purple-500"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    {isDoc
                      ? `Abrir Portal do ${user.name.split(" ")[0]}`
                      : isAdmin
                      ? "Entrar no Painel Admin"
                      : "Entrar na Recepção"}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                </button>

                <button
                  onClick={() => handleCopyCredentials(user)}
                  className="w-full py-1.5 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "Credenciais Copiadas!" : "Copiar Acesso p/ WhatsApp"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Nenhum usuário encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não encontramos nenhum usuário com os termos pesquisados. Clique no botão abaixo para adicionar um novo médico ou membro da equipe.
          </p>
          <button
            onClick={() => handleOpenAddModal("doctor")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Usuário Agora</span>
          </button>
        </div>
      )}

      {/* Modal: Create or Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  {formRole === "doctor" ? <Stethoscope className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingUserId ? "Editar Usuário" : "Cadastrar Novo Usuário na Clínica"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Acesso institucional protegido para médicos, recepcionistas e administradores
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Role Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Perfil de Acesso do Usuário:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormRole("doctor");
                      soundEffects.playClick();
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      formRole === "doctor"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span>Médico</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormRole("receptionist");
                      soundEffects.playClick();
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      formRole === "receptionist"
                        ? "border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <span>Recepção</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormRole("admin");
                      soundEffects.playClick();
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      formRole === "admin"
                        ? "border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Shield className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <span>Administrador</span>
                  </button>
                </div>
              </div>

              {/* Doctor Linking Option */}
              {formRole === "doctor" && !editingUserId && (
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2.5">
                  <label className="block font-bold text-emerald-950">
                    Vincular a um Médico / Especialidade:
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleSelectServiceChange(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <optgroup label="Médicos Atuais Cadastrados">
                      {services.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.doctor} — {svc.name} ({svc.crm || "CRM/PA"})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Novo Cadastro">
                      <option value="__NEW__">✨ + Cadastrar Novo Médico & Especialidade</option>
                    </optgroup>
                  </select>
                </div>
              )}

              {/* New Doctor Extra Fields */}
              {formRole === "doctor" && (isCreatingNewDoctorService || selectedServiceId === "__NEW__") && (
                <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-300 space-y-3">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Dados Clínicos do Novo Médico</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Especialidade / Serviço:</label>
                      <input
                        type="text"
                        value={newDoctorSpecialty}
                        onChange={(e) => setNewDoctorSpecialty(e.target.value)}
                        placeholder="Ex: Neurologia, Pediatria..."
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">CRM / Registro:</label>
                      <input
                        type="text"
                        value={newDoctorCrm}
                        onChange={(e) => setNewDoctorCrm(e.target.value)}
                        placeholder="Ex: CRM 19284/PA"
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Valor da Consulta (R$):</label>
                      <input
                        type="number"
                        value={newDoctorPrice}
                        onChange={(e) => setNewDoctorPrice(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Duração da Consulta:</label>
                      <select
                        value={newDoctorDuration}
                        onChange={(e) => setNewDoctorDuration(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="20">20 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="40">40 minutos</option>
                        <option value="45">45 minutos</option>
                        <option value="60">60 minutos</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Foto (médico ou usuário) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto:</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                    {formAvatarUrl ? (
                      <img src={formAvatarUrl} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
                      {isUploadingAvatar ? "Enviando..." : "Escolher foto"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingAvatar}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(file);
                        }}
                      />
                    </label>
                    {avatarUploadError && (
                      <p className="text-[11px] text-red-600 mt-1">{avatarUploadError}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={formRole === "doctor" ? "Ex: Dr. Alexandre Bezerra" : "Ex: Maria Fernanda Souza"}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Email / Login */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email / Login de Acesso:
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="usuario@santaclara.com.br"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Phone and PIN in 2 cols */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    WhatsApp / Telefone:
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(91) 98123-4567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      PIN / Senha:
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormPin(Math.floor(1000 + Math.random() * 9000).toString())}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Gerar PIN
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    placeholder="1234"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status da Conta:</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formStatus === "active"}
                      onChange={() => setFormStatus("active")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-emerald-800">Ativo (Acesso Liberado)</span>
                  </label>

                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formStatus === "inactive"}
                      onChange={() => setFormStatus("inactive")}
                      className="text-slate-600 focus:ring-slate-500"
                    />
                    <span className="font-medium text-slate-500">Inativo (Bloqueado)</span>
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingUserId ? "Salvar Alterações" : "Concluir Cadastro"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
