import React, { useState } from "react";
import {
  FlaskConical,
  FileText,
  Calculator,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  Percent,
  Sparkles,
  Clock,
  AlertCircle,
  Copy,
  DollarSign,
  Send,
  Building2,
  Share2,
} from "lucide-react";
import { LabExamItem, QuoteResult, QuoteItem, ServiceItem } from "../types";

interface QuotesAndExamsProps {
  exams: LabExamItem[];
  services: ServiceItem[];
  quotes: QuoteResult[];
  onSaveExams: (newExams: LabExamItem[]) => void;
  onSendQuoteToWhatsApp?: (quote: QuoteResult) => void;
  viewMode?: "client" | "agency";
}

export const QuotesAndExams: React.FC<QuotesAndExamsProps> = ({
  exams,
  services,
  quotes,
  onSaveExams,
  onSendQuoteToWhatsApp,
  viewMode = "agency",
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"calculator" | "catalog" | "history">("calculator");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // Interactive Quote Builder State
  const [patientNameInput, setPatientNameInput] = useState("Carlos Eduardo Silva");
  const [patientPhoneInput, setPatientPhoneInput] = useState("5591981112233");
  const [selectedItems, setSelectedItems] = useState<QuoteItem[]>([
    {
      id: "hemograma-completo",
      name: "Hemograma Completo",
      type: "exame",
      price: 35,
      doctorOrLab: "Laboratório Santa Clara",
      preparation: "Jejum recomendado de 4 horas",
    },
    {
      id: "glicemia-jejum",
      name: "Glicemia em Jejum",
      type: "exame",
      price: 25,
      doctorOrLab: "Laboratório Santa Clara",
      preparation: "Jejum obrigatório de 8 a 12 horas",
    },
    {
      id: "perfil-lipidico",
      name: "Perfil Lipídico / Colesterol Total",
      type: "exame",
      price: 55,
      doctorOrLab: "Laboratório Santa Clara",
      preparation: "Jejum de 12 horas",
    },
  ]);
  const [customDiscountPercent, setCustomDiscountPercent] = useState<number>(5);
  const [lastGeneratedQuote, setLastGeneratedQuote] = useState<QuoteResult | null>(null);
  const [copiedQuotePix, setCopiedQuotePix] = useState(false);

  // New Exam Modal / Inline Form
  const [isEditingExam, setIsEditingExam] = useState<LabExamItem | null>(null);
  const [isAddingNewExam, setIsAddingNewExam] = useState(false);
  const [newExamForm, setNewExamForm] = useState<Partial<LabExamItem>>({
    category: "Sangue / Bioquímica",
    price: 50,
    preparation: "Jejum de 4 a 8 horas",
    resultDeadline: "24 horas úteis",
    popular: true,
  });

  // Calculate quote subtotal and totals
  const quoteSubtotal = selectedItems.reduce((acc, item) => acc + item.price, 0);
  const discountAmount = Math.round((quoteSubtotal * customDiscountPercent) / 100);
  const quoteTotal = Math.max(0, quoteSubtotal - discountAmount);
  const pixDiscountTotal = Math.round(quoteTotal * 0.95);

  const categories = [
    "Todos",
    "Sangue / Bioquímica",
    "Imagem / Ultrassom",
    "Cardiológico",
    "Urina / Fezes",
    "Genético / Hormonal",
  ];

  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.preparation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "Todos" || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddItemToQuote = (item: { id: string; name: string; type: "consulta" | "exame"; price: number; doctorOrLab?: string; preparation?: string }) => {
    if (selectedItems.some((i) => i.id === item.id)) return;
    setSelectedItems((prev) => [...prev, item]);
  };

  const handleRemoveItemFromQuote = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleGenerateQuote = () => {
    const quoteId = `ORC-${Math.floor(1000 + Math.random() * 9000)}`;
    const pixCode = `00020126580014br.gov.bcb.pix0136clinicamedicasantaclara-pix-${quoteId}5204000053039865406${pixDiscountTotal.toFixed(2)}5802BR5925CLINICA MEDICA SANTA CLARA6009BELEM62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const quoteObj: QuoteResult = {
      id: quoteId,
      patientName: patientNameInput || "Paciente",
      items: [...selectedItems],
      subtotal: quoteSubtotal,
      discount: discountAmount,
      total: quoteTotal,
      pixDiscountTotal,
      createdAt: new Date().toISOString(),
      pixCode,
      paymentLink: `https://mpago.la/orc/${quoteId.toLowerCase()}`,
      notes: "Orçamento gerado pelo painel da clínica.",
    };

    setLastGeneratedQuote(quoteObj);
    if (onSendQuoteToWhatsApp) {
      onSendQuoteToWhatsApp(quoteObj);
    }
  };

  const handleSaveNewExam = () => {
    if (!newExamForm.name || !newExamForm.price) return;
    const newExam: LabExamItem = {
      id: newExamForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name: newExamForm.name,
      category: (newExamForm.category as any) || "Sangue / Bioquímica",
      price: Number(newExamForm.price),
      preparation: newExamForm.preparation || "Sem preparo especial",
      resultDeadline: newExamForm.resultDeadline || "24 horas",
      popular: !!newExamForm.popular,
    };

    const updated = [newExam, ...exams];
    onSaveExams(updated);
    setIsAddingNewExam(false);
    setNewExamForm({
      category: "Sangue / Bioquímica",
      price: 50,
      preparation: "Jejum de 4 a 8 horas",
      resultDeadline: "24 horas úteis",
      popular: true,
    });
  };

  const handleUpdateExam = () => {
    if (!isEditingExam) return;
    const updated = exams.map((e) => (e.id === isEditingExam.id ? isEditingExam : e));
    onSaveExams(updated);
    setIsEditingExam(null);
  };

  const handleDeleteExam = (id: string) => {
    if (confirm("Deseja realmente remover este exame da tabela da clínica?")) {
      const updated = exams.filter((e) => e.id !== id);
      onSaveExams(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Navigation */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border border-teal-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Orçamentos de Consultas & Exames Laboratoriais
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
                  IA Orçamentos Ativa
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Monte orçamentos instantâneos para pacientes, consulte a tabela de exames, preparos de coleta e envie Pix com desconto diretamente no WhatsApp.
              </p>
            </div>
          </div>

          {/* Subtabs */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 self-start lg:self-auto">
            <button
              id="subtab-calculator"
              onClick={() => setActiveSubTab("calculator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === "calculator"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculadora de Orçamento</span>
            </button>

            <button
              id="subtab-catalog"
              onClick={() => setActiveSubTab("catalog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === "catalog"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Catálogo de Exames ({exams.length})</span>
            </button>

            <button
              id="subtab-history"
              onClick={() => setActiveSubTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === "history"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Histórico de Orçamentos ({quotes.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: CALCULADORA DE ORÇAMENTO INTERATIVA */}
      {activeSubTab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Quick Add items (Consultations + Exams) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4 text-teal-400" />
                Adicionar Itens ao Orçamento
              </h3>

              {/* Patient info inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Nome do Paciente</label>
                  <input
                    type="text"
                    value={patientNameInput}
                    onChange={(e) => setPatientNameInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    placeholder="Ex: Carlos Eduardo Silva"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">WhatsApp do Paciente</label>
                  <input
                    type="text"
                    value={patientPhoneInput}
                    onChange={(e) => setPatientPhoneInput(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    placeholder="5591981112233"
                  />
                </div>
              </div>

              {/* Consultas Médicas Quick Selection */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>🩺 Consultas Médicas com Especialistas</span>
                  <span className="text-[10px] text-slate-500">Clique para incluir</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map((srv) => {
                    const isAdded = selectedItems.some((i) => i.id === srv.id);
                    return (
                      <button
                        key={srv.id}
                        onClick={() =>
                          isAdded
                            ? handleRemoveItemFromQuote(srv.id)
                            : handleAddItemToQuote({
                                id: srv.id,
                                name: srv.name,
                                type: "consulta",
                                price: srv.price,
                                doctorOrLab: srv.doctor,
                                preparation: "Trazer exames anteriores e documento com foto",
                              })
                        }
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                          isAdded
                            ? "bg-teal-950/60 border-teal-500/80 text-teal-200"
                            : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-xs truncate">{srv.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{srv.doctor}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-emerald-400">R$ {srv.price.toFixed(2)}</div>
                          <span className={`text-[10px] font-semibold ${isAdded ? "text-teal-400" : "text-slate-500"}`}>
                            {isAdded ? "✓ Adicionado" : "+ Incluir"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exames Laboratoriais Quick Selection */}
              <div>
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>🔬 Exames Laboratoriais Populares</span>
                  <span className="text-[10px] text-slate-500">Coleta das 07h às 11h30</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {exams.map((ex) => {
                    const isAdded = selectedItems.some((i) => i.id === ex.id);
                    return (
                      <button
                        key={ex.id}
                        onClick={() =>
                          isAdded
                            ? handleRemoveItemFromQuote(ex.id)
                            : handleAddItemToQuote({
                                id: ex.id,
                                name: ex.name,
                                type: "exame",
                                price: ex.price,
                                doctorOrLab: "Laboratório Santa Clara",
                                preparation: ex.preparation,
                              })
                        }
                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                          isAdded
                            ? "bg-teal-950/60 border-teal-500/80 text-teal-200"
                            : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-xs truncate">{ex.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{ex.category}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-teal-300">R$ {ex.price.toFixed(2)}</div>
                          <span className={`text-[10px] font-semibold ${isAdded ? "text-teal-400" : "text-slate-500"}`}>
                            {isAdded ? "✓ Adicionado" : "+ Incluir"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quote Summary & WhatsApp Dispatch */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Resumo do Orçamento
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-teal-500/20 text-teal-300 rounded-full">
                    {selectedItems.length} {selectedItems.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                {/* Selected Items List */}
                <div className="py-3 space-y-2 max-h-56 overflow-y-auto">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Nenhum exame ou consulta selecionado ainda. Clique nos itens ao lado para compor a proposta.
                    </div>
                  ) : (
                    selectedItems.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-slate-200 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span className={item.type === "exame" ? "text-teal-400" : "text-indigo-400"}>
                              {item.type === "exame" ? "🔬 Exame" : "🩺 Consulta"}
                            </span>
                            <span>•</span>
                            <span className="truncate">{item.doctorOrLab}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-slate-100">R$ {item.price.toFixed(2)}</span>
                          <button
                            onClick={() => handleRemoveItemFromQuote(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Discount & Math Section */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Subtotal de Tabela:</span>
                    <span className="font-medium text-slate-200">R$ {quoteSubtotal.toFixed(2)}</span>
                  </div>

                  {/* Discount slider */}
                  <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-amber-400" />
                        Desconto do Pacote:
                      </span>
                      <span className="font-bold text-amber-400">{customDiscountPercent}% (- R$ {discountAmount.toFixed(2)})</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={customDiscountPercent}
                      onChange={(e) => setCustomDiscountPercent(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-100">
                    <span>Total Parcelado / Cartão:</span>
                    <span className="text-sm text-emerald-400">R$ {quoteTotal.toFixed(2)}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        Valor à Vista no Pix (Extra 5% OFF):
                      </div>
                      <div className="text-[10px] text-emerald-400/80">Chave Pix dinâmica gerada na hora</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-300">R$ {pixDiscountTotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 space-y-2">
                <button
                  id="btn-generate-quote"
                  disabled={selectedItems.length === 0}
                  onClick={handleGenerateQuote}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    selectedItems.length > 0
                      ? "bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Gerar Orçamento & Enviar no WhatsApp</span>
                </button>

                {lastGeneratedQuote && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-teal-500/40 text-xs space-y-2 mt-2">
                    <div className="flex items-center justify-between text-[11px] text-teal-400 font-bold">
                      <span>✓ Orçamento #{lastGeneratedQuote.id} Gerado!</span>
                      <span className="text-slate-400">{new Date(lastGeneratedQuote.createdAt).toLocaleTimeString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-300 font-mono truncate">{lastGeneratedQuote.pixCode}</span>
                      <button
                        onClick={() => {
                          if (lastGeneratedQuote.pixCode) {
                            navigator.clipboard.writeText(lastGeneratedQuote.pixCode);
                            setCopiedQuotePix(true);
                            setTimeout(() => setCopiedQuotePix(false), 2000);
                          }
                        }}
                        className="px-2 py-1 rounded bg-teal-800 hover:bg-teal-700 text-white font-semibold text-[10px] shrink-0"
                      >
                        {copiedQuotePix ? "Copiado!" : "Copiar Pix"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CATÁLOGO DE EXAMES LABORATORIAIS */}
      {activeSubTab === "catalog" && (
        <div className="space-y-4">
          {/* Filter and Add bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar exame, preparo ou categoria..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddingNewExam(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Exame</span>
            </button>
          </div>

          {/* Add New Exam Inline Card */}
          {isAddingNewExam && (
            <div className="bg-slate-900 border-2 border-teal-500/50 rounded-xl p-4 shadow-md animate-in fade-in duration-200">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-400" />
                Cadastrar Novo Exame Laboratorial na Clínica
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Nome do Exame *</label>
                  <input
                    type="text"
                    value={newExamForm.name || ""}
                    onChange={(e) => setNewExamForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Ferritina Sérica"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Categoria</label>
                  <select
                    value={newExamForm.category}
                    onChange={(e) => setNewExamForm((p) => ({ ...p, category: e.target.value as any }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="Sangue / Bioquímica">Sangue / Bioquímica</option>
                    <option value="Imagem / Ultrassom">Imagem / Ultrassom</option>
                    <option value="Cardiológico">Cardiológico</option>
                    <option value="Urina / Fezes">Urina / Fezes</option>
                    <option value="Genético / Hormonal">Genético / Hormonal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Valor Oficial (R$) *</label>
                  <input
                    type="number"
                    value={newExamForm.price || ""}
                    onChange={(e) => setNewExamForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    placeholder="45.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Instruções de Preparo / Jejum</label>
                  <input
                    type="text"
                    value={newExamForm.preparation || ""}
                    onChange={(e) => setNewExamForm((p) => ({ ...p, preparation: e.target.value }))}
                    placeholder="Jejum obrigatório de 8 horas"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Prazo de Entrega do Laudo</label>
                  <input
                    type="text"
                    value={newExamForm.resultDeadline || ""}
                    onChange={(e) => setNewExamForm((p) => ({ ...p, resultDeadline: e.target.value }))}
                    placeholder="24 a 48 horas úteis"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsAddingNewExam(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNewExam}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm"
                >
                  Salvar Exame
                </button>
              </div>
            </div>
          )}

          {/* Exam Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Exame / Procedimento</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Preparo / Jejum</th>
                    <th className="p-3">Prazo Laudo</th>
                    <th className="p-3">Valor (R$)</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredExams.map((ex) => {
                    const isEditing = isEditingExam?.id === ex.id;
                    return (
                      <tr key={ex.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-100">
                          {isEditing ? (
                            <input
                              type="text"
                              value={isEditingExam.name}
                              onChange={(e) => setIsEditingExam({ ...isEditingExam, name: e.target.value })}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{ex.name}</span>
                              {ex.popular && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                                  Mais Pedido
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-slate-300">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                            {ex.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs truncate" title={ex.preparation}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={isEditingExam.preparation}
                              onChange={(e) => setIsEditingExam({ ...isEditingExam, preparation: e.target.value })}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                            />
                          ) : (
                            ex.preparation
                          )}
                        </td>
                        <td className="p-3 text-slate-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={isEditingExam.resultDeadline}
                              onChange={(e) => setIsEditingExam({ ...isEditingExam, resultDeadline: e.target.value })}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-28"
                            />
                          ) : (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {ex.resultDeadline}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-teal-300">
                          {isEditing ? (
                            <input
                              type="number"
                              value={isEditingExam.price}
                              onChange={(e) => setIsEditingExam({ ...isEditingExam, price: Number(e.target.value) })}
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-20"
                            />
                          ) : (
                            `R$ ${ex.price.toFixed(2)}`
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={handleUpdateExam}
                                className="p-1 rounded bg-teal-600 text-white hover:bg-teal-500"
                                title="Salvar"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setIsEditingExam(null)}
                                className="p-1 rounded bg-slate-700 text-slate-300 hover:text-white"
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setIsEditingExam(ex)}
                                className="p-1.5 text-slate-400 hover:text-teal-300 transition-colors"
                                title="Editar exame"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExam(ex.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Excluir exame"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: HISTÓRICO DE ORÇAMENTOS GERADOS */}
      {activeSubTab === "history" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-1">
              Propostas e Orçamentos Gerados pelo Sistema / WhatsApp
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cada orçamento possui link exclusivo do Mercado Pago e chave Pix com validade de 7 dias.
            </p>

            {quotes.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum orçamento emitido ainda. Use a calculadora para gerar o primeiro ou simule no chat do WhatsApp!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quotes.map((q) => (
                  <div
                    key={q.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <div>
                        <div className="font-bold text-white text-xs">{q.patientName || "Paciente"}</div>
                        <div className="text-[10px] text-slate-400">ID: {q.id} • {new Date(q.createdAt).toLocaleDateString("pt-BR")} às {new Date(q.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        Válido por 7 dias
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1 text-xs">
                      {q.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between text-slate-300">
                          <span className="truncate pr-2">• {it.name}</span>
                          <span className="font-semibold text-slate-200 shrink-0">R$ {it.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Total: </span>
                        <span className="font-bold text-slate-200">R$ {q.total.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-400/80">À vista no Pix: </span>
                        <span className="font-black text-emerald-300">R$ {(q.pixDiscountTotal || q.total * 0.95).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Copy Pix */}
                    {q.pixCode && (
                      <div className="pt-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-500 truncate">{q.pixCode}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(q.pixCode!);
                            alert("Chave Pix Copia e Cola copiada para a área de transferência!");
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[10px] shrink-0 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar Pix</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
