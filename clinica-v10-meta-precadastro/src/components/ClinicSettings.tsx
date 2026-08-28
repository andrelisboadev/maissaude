import React, { useState } from "react";
import {
  Settings,
  Building,
  DollarSign,
  Clock,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Shield,
  Calendar,
  UserCheck,
  FileText,
  Stethoscope,
  Users,
  Key,
} from "lucide-react";
import { ClinicConfig, ServiceItem } from "../types";

interface ClinicSettingsProps {
  clinicConfig: ClinicConfig;
  services: ServiceItem[];
  onSaveSettings: (config: ClinicConfig, services: ServiceItem[]) => Promise<void>;
  onReset: () => void;
  onNavigateToUsers?: () => void;
}

const ALL_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const ClinicSettings: React.FC<ClinicSettingsProps> = ({
  clinicConfig,
  services,
  onSaveSettings,
  onReset,
  onNavigateToUsers,
}) => {
  const [config, setConfig] = useState<ClinicConfig>({ ...clinicConfig });
  const [serviceList, setServiceList] = useState<ServiceItem[]>([...services]);
  const [isSaved, setIsSaved] = useState(false);

  // New Service Form state
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("Especialidades");
  const [newServicePrice, setNewServicePrice] = useState("200");
  const [newServiceDoctor, setNewServiceDoctor] = useState("");
  const [newServiceCrm, setNewServiceCrm] = useState("");
  const [newServiceSpecialtyDetails, setNewServiceSpecialtyDetails] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [newServiceDays, setNewServiceDays] = useState<string[]>(["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]);
  const [newServiceStartHour, setNewServiceStartHour] = useState("08:00");
  const [newServiceEndHour, setNewServiceEndHour] = useState("18:00");

  const handlePriceChange = (id: string, newPrice: number) => {
    setServiceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, price: Math.max(1, newPrice) } : s))
    );
  };

  const handleDoctorChange = (id: string, newDoctor: string) => {
    setServiceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, doctor: newDoctor } : s))
    );
  };

  const handleCrmChange = (id: string, newCrm: string) => {
    setServiceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, crm: newCrm } : s))
    );
  };

  const handleSpecialtyDetailsChange = (id: string, newDetails: string) => {
    setServiceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, specialtyDetails: newDetails } : s))
    );
  };

  const handleDurationChange = (id: string, newDuration: number) => {
    setServiceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, durationMinutes: Math.max(10, newDuration) } : s))
    );
  };

  const handleHoursChange = (id: string, start: string, end: string) => {
    setServiceList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, workStartHour: start, workEndHour: end } : s))
    );
  };

  const handleToggleDay = (id: string, day: string) => {
    setServiceList((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const currentDays = s.availableDays || ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
        const hasDay = currentDays.includes(day);
        const newDays = hasDay
          ? currentDays.filter((d) => d !== day)
          : [...currentDays, day];
        return { ...s, availableDays: newDays.length > 0 ? newDays : [day] };
      })
    );
  };

  const handleToggleNewServiceDay = (day: string) => {
    setNewServiceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleDeleteService = (id: string) => {
    setServiceList((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceDoctor.trim()) return;

    const id = newServiceName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const newService: ServiceItem = {
      id: `${id}-${Date.now().toString().slice(-4)}`,
      name: newServiceName,
      category: newServiceCategory,
      price: parseFloat(newServicePrice) || 180,
      durationMinutes: parseInt(newServiceDuration) || 30,
      doctor: newServiceDoctor,
      crm: newServiceCrm.trim() || undefined,
      specialtyDetails: newServiceSpecialtyDetails.trim() || `Atendimento especializado em ${newServiceName}`,
      description: `Consulta especializada com ${newServiceDoctor}`,
      availableDays: newServiceDays.length > 0 ? newServiceDays : ["Segunda", "Quarta", "Sexta"],
      workStartHour: newServiceStartHour || "08:00",
      workEndHour: newServiceEndHour || "18:00",
    };

    setServiceList((prev) => [...prev, newService]);
    setNewServiceName("");
    setNewServiceDoctor("");
    setNewServiceCrm("");
    setNewServiceSpecialtyDetails("");
  };

  const handleSubmit = async () => {
    await onSaveSettings(config, serviceList);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Configuração de Profissionais & Especialidades Detalhadas</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Cadastre médicos, defina <strong>especialidades e áreas de foco clínico (tireoide, diabetes, etc)</strong>, dias de atendimento e valores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToUsers && (
            <button
              onClick={onNavigateToUsers}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Gerenciar Usuários & Logins</span>
            </button>
          )}

          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-colors"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? "Salvo com Sucesso!" : "Salvar Alterações"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Clinic Identity & Hours (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Dados Gerais da Clínica</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nome da Clínica:
                </label>
                <input
                  type="text"
                  value={config.clinicName}
                  onChange={(e) => setConfig({ ...config, clinicName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  CNPJ (aparece no papel timbrado de receitas/atestados):
                </label>
                <input
                  type="text"
                  value={config.cnpj || ""}
                  onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Telefone da Recepção (Central):
                </label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Endereço Completo:
                </label>
                <input
                  type="text"
                  value={config.address}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Horário Geral de Funcionamento:
                </label>
                <input
                  type="text"
                  value={config.businessHours}
                  onChange={(e) => setConfig({ ...config, businessHours: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tempo Limite para Pagamento Pix (minutos):
                </label>
                <input
                  type="number"
                  value={config.paymentTimeoutMinutes}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentTimeoutMinutes: parseInt(e.target.value) || 15,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Agency & Commercial Contact Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5 rounded-2xl border border-emerald-800/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Parceiro de Implementação
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                Agência Oficial
              </span>
            </div>

            <div>
              <h4 className="font-bold text-base text-white">LocalizeHub / Venda Mais Digital</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Automação com IA Gemini 3.7 Flash, WhatsApp Baileys Bridge e integração Supabase / Mercado Pago.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">WhatsApp Comercial:</span>
              <strong className="text-emerald-300 font-mono">(91) 98839-0894</strong>
            </div>
          </div>
        </div>

        {/* Services & Doctors Schedule Manager (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Profissionais, Especialidades Clínicas & Grade de Atendimento
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">{serviceList.length} médicos</span>
            </div>

            {/* List of Doctors / Services with full schedule control */}
            <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
              {serviceList.map((srv) => {
                const currentDays = srv.availableDays || ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
                const startHour = srv.workStartHour || "08:00";
                const endHour = srv.workEndHour || "18:00";

                return (
                  <div
                    key={srv.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-emerald-300 transition-colors"
                  >
                    {/* Top Row: Service Name, Doctor Name, CRM, Price, Delete */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <span className="font-bold text-slate-900 text-sm block">{srv.name}</span>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-500">Médico:</span>
                            <input
                              type="text"
                              value={srv.doctor}
                              onChange={(e) => handleDoctorChange(srv.id, e.target.value)}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-900 font-semibold text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-500">CRM:</span>
                            <input
                              type="text"
                              placeholder="ex: 12345/PA"
                              value={srv.crm || ""}
                              onChange={(e) => handleCrmChange(srv.id, e.target.value)}
                              className="w-24 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-900 text-xs focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1 border border-slate-200 rounded-lg">
                          <span className="text-xs text-slate-500 font-semibold">R$</span>
                          <input
                            type="number"
                            value={srv.price}
                            onChange={(e) => handlePriceChange(srv.id, parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-bold text-slate-900 text-xs focus:outline-none"
                          />
                        </div>

                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir especialidade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Specialty Details / Clinical Focus (e.g. Tireoide, Hipertireoidismo, Diabetes, etc.) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                        <span>Informações da Especialidade & Áreas de Foco Clínico (IA WhatsApp / Prontuário):</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Especialista em tireoide, hipertireoidismo, nódulos tireoidianos, diabetes e reposição hormonal..."
                        value={srv.specialtyDetails || ""}
                        onChange={(e) => handleSpecialtyDetailsChange(srv.id, e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Schedule Row: Working Days & Working Hours */}
                    <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                      {/* Available Days */}
                      <div className="sm:col-span-7 space-y-1.5">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dias da Semana em que Atende:</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {ALL_DAYS.map((day) => {
                            const isSelected = currentDays.includes(day);
                            return (
                              <button
                                type="button"
                                key={day}
                                onClick={() => handleToggleDay(srv.id, day)}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                                  isSelected
                                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {day.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Working Hours */}
                      <div className="sm:col-span-5 space-y-1.5">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Horário de Atendimento:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={startHour}
                            placeholder="08:00"
                            onChange={(e) => handleHoursChange(srv.id, e.target.value, endHour)}
                            className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded text-center text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-slate-400">às</span>
                          <input
                            type="text"
                            value={endHour}
                            placeholder="18:00"
                            onChange={(e) => handleHoursChange(srv.id, startHour, e.target.value)}
                            className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded text-center text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-[10px] text-slate-500 font-mono">({srv.durationMinutes}m)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Doctor / Service Form */}
            <form
              onSubmit={handleAddService}
              className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-3"
            >
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cadastrar Novo Profissional & Especialidade</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <input
                    type="text"
                    placeholder="Especialidade (ex: Endocrinologia)"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Médico (ex: Dra. Juliana Paes)"
                    value={newServiceDoctor}
                    onChange={(e) => setNewServiceDoctor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="CRM (ex: 8877/PA)"
                    value={newServiceCrm}
                    onChange={(e) => setNewServiceCrm(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Valor (R$)"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 text-right focus:ring-1 focus:ring-emerald-500"
                  />

                  <button
                    type="submit"
                    disabled={!newServiceName.trim() || !newServiceDoctor.trim()}
                    className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                  >
                    Cadastrar
                  </button>
                </div>
              </div>

              {/* Specialty Details for new doctor */}
              <div>
                <input
                  type="text"
                  placeholder="Informações da Especialidade (ex: Cuida de tireoide, hipotireoidismo, diabetes, obesidade e metabolismo)"
                  value={newServiceSpecialtyDetails}
                  onChange={(e) => setNewServiceSpecialtyDetails(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Working days for new service */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-600 font-semibold">Dias:</span>
                <div className="flex flex-wrap gap-1">
                  {ALL_DAYS.map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleToggleNewServiceDay(day)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        newServiceDays.includes(day)
                          ? "bg-emerald-600 text-white font-bold"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
