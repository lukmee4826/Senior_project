import React, { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "../../utils/api";
import { useTheme } from "../ThemeContext";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Trash2, Pencil, Plus, Check, X } from "lucide-react";

export function AdminPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [tab, setTab] = useState<"microbes" | "antibiotics" | "standards" | "breakpoints">("microbes");

    const cardCls = `p-6 shadow-xl ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`;
    const thCls = `text-left px-4 py-3 text-sm font-semibold ${isDark ? "text-gray-300 bg-gray-800" : "text-gray-700 bg-gray-50"}`;
    const tdCls = `px-4 py-3 text-sm ${isDark ? "text-gray-200" : "text-gray-800"}`;
    const rowCls = `border-t ${isDark ? "border-gray-700 hover:bg-gray-800/50" : "border-gray-100 hover:bg-gray-50"}`;
    const inputCls = `h-8 px-2 text-sm border rounded ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;
    const tabActiveStyle = isDark ? "bg-blue-900/50 text-blue-400 border-blue-600" : "bg-blue-50 text-blue-700 border-blue-400";
    const tabStyle = isDark ? "text-gray-400 border-gray-700 hover:bg-gray-800" : "text-gray-600 border-gray-200 hover:bg-gray-100";
    const selCls = `h-8 px-2 text-sm border rounded ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`;
    // Table wrapper: scrollable area inside a clipped border
    const tableWrap = "rounded-lg border overflow-hidden";
    const tableScroll = "overflow-auto max-h-[800px]";

    const MB_PAGE_SIZE = 100;
    const AB_PAGE_SIZE = 100;
    const BP_PAGE_SIZE = 50;

    // ======================== MICROBES ========================
    const [microbes, setMicrobes] = useState<any[]>([]);
    const [newMicrobeName, setNewMicrobeName] = useState("");
    const [editMicrobe, setEditMicrobe] = useState<{ id: number; name: string } | null>(null);
    const [microbeError, setMicrobeError] = useState("");
    const [microbePage, setMicrobePage] = useState(0);

    const fetchMicrobes = useCallback(async () => {
        const r = await fetchWithAuth("/microbes?limit=500");
        if (r.ok) setMicrobes(await r.json());
    }, []);
    useEffect(() => { fetchMicrobes(); }, [fetchMicrobes]);

    const addMicrobe = async () => {
        if (!newMicrobeName.trim()) return;
        setMicrobeError("");
        const r = await fetchWithAuth("/microbes", { method: "POST", body: JSON.stringify({ strain_name: newMicrobeName.trim() }) });
        if (r.ok) { setNewMicrobeName(""); fetchMicrobes(); }
        else { const e = await r.json(); setMicrobeError(e.detail || "Error"); }
    };
    const saveMicrobe = async () => {
        if (!editMicrobe) return;
        const r = await fetchWithAuth(`/microbes/${editMicrobe.id}`, { method: "PUT", body: JSON.stringify({ strain_name: editMicrobe.name }) });
        if (r.ok) { setEditMicrobe(null); fetchMicrobes(); }
    };
    const deleteMicrobe = async (id: number) => {
        if (!confirm("ลบเชื้อนี้?")) return;
        const r = await fetchWithAuth(`/microbes/${id}`, { method: "DELETE" });
        if (!r.ok) {
            const e = await r.json();
            alert(e.detail || "ลบเชื้อไม่สำเร็จ");
            return;
        }
        fetchMicrobes();
    };

    // ======================== ANTIBIOTICS ========================
    const [antibiotics, setAntibiotics] = useState<any[]>([]);
    const [newAb, setNewAb] = useState({ name: "", abbreviation: "", concentration_ug: "0" });
    const [editAb, setEditAb] = useState<{ id: number; name: string; abbreviation: string; concentration_ug: number } | null>(null);
    const [abPage, setAbPage] = useState(0);

    const fetchAntibiotics = useCallback(async () => {
        const r = await fetchWithAuth("/antibiotics?limit=500");
        if (r.ok) setAntibiotics(await r.json());
    }, []);
    useEffect(() => { fetchAntibiotics(); }, [fetchAntibiotics]);

    const addAntibiotic = async () => {
        if (!newAb.name.trim()) return;
        const r = await fetchWithAuth("/antibiotics", { method: "POST", body: JSON.stringify({ name: newAb.name.trim(), abbreviation: newAb.abbreviation.trim() || null, concentration_ug: parseInt(newAb.concentration_ug) || 0 }) });
        if (r.ok) { setNewAb({ name: "", abbreviation: "", concentration_ug: "0" }); fetchAntibiotics(); }
    };
    const saveAntibiotic = async () => {
        if (!editAb) return;
        const r = await fetchWithAuth(`/antibiotics/${editAb.id}`, { method: "PUT", body: JSON.stringify({ name: editAb.name, abbreviation: editAb.abbreviation, concentration_ug: editAb.concentration_ug }) });
        if (r.ok) { setEditAb(null); fetchAntibiotics(); }
    };
    const deleteAntibiotic = async (id: number) => {
        if (!confirm("ลบยานี้?")) return;
        const r = await fetchWithAuth(`/antibiotics/${id}`, { method: "DELETE" });
        if (!r.ok) {
            const e = await r.json();
            alert(e.detail || "ลบยาไม่สำเร็จ");
            return;
        }
        fetchAntibiotics();
    };

    // ======================== STANDARDS ========================
    const [standards, setStandards] = useState<any[]>([]);
    const [newStd, setNewStd] = useState({ standard_name: "", standard_version: "" });
    const [editStd, setEditStd] = useState<{ id: number; name: string; version: string } | null>(null);

    const fetchStandards = useCallback(async () => {
        const r = await fetchWithAuth("/standards");
        if (r.ok) setStandards(await r.json());
    }, []);
    useEffect(() => { fetchStandards(); }, [fetchStandards]);

    const addStandard = async () => {
        if (!newStd.standard_name.trim()) return;
        const r = await fetchWithAuth("/standards", { method: "POST", body: JSON.stringify(newStd) });
        if (r.ok) { setNewStd({ standard_name: "", standard_version: "" }); fetchStandards(); }
    };
    const saveStandard = async () => {
        if (!editStd) return;
        const r = await fetchWithAuth(`/standards/${editStd.id}`, { method: "PUT", body: JSON.stringify({ standard_name: editStd.name, standard_version: editStd.version }) });
        if (r.ok) { setEditStd(null); fetchStandards(); }
    };
    const deleteStandard = async (id: number) => {
        if (!confirm("ลบ Standard นี้?")) return;
        const r = await fetchWithAuth(`/standards/${id}`, { method: "DELETE" });
        if (!r.ok) {
            const e = await r.json();
            alert(e.detail || "ลบ Standard ไม่สำเร็จ");
            return;
        }
        fetchStandards();
    };

    // ======================== BREAKPOINTS ========================
    const [breakpoints, setBreakpoints] = useState<any[]>([]);
    const [bpFilter, setBpFilter] = useState({ microbe_id: "", standard_id: "" });
    const [editBp, setEditBp] = useState<any | null>(null);
    const [newBp, setNewBp] = useState({ standard_id: "", microbe_id: "", antibiotic_id: "", susceptible_min_mm: "", intermediate_min_mm: "", intermediate_max_mm: "", resistant_max_mm: "" });
    const [bpError, setBpError] = useState("");
    const [bpCount, setBpCount] = useState(0);
    const [bpPage, setBpPage] = useState(0);
    const [abSearch, setAbSearch] = useState("");

    const filteredAbs = abSearch.trim()
        ? antibiotics.filter((a: any) => a.name.toLowerCase().includes(abSearch.toLowerCase()) || (a.abbreviation || "").toLowerCase().includes(abSearch.toLowerCase())).slice(0, 30)
        : antibiotics.slice(0, 30);

    const fetchBreakpoints = useCallback(async () => {
        const params = new URLSearchParams({ skip: String(bpPage * BP_PAGE_SIZE), limit: String(BP_PAGE_SIZE) });
        if (bpFilter.microbe_id) params.set("microbe_id", bpFilter.microbe_id);
        if (bpFilter.standard_id) params.set("standard_id", bpFilter.standard_id);
        const r = await fetchWithAuth(`/breakpoints?${params}`);
        if (r.ok) setBreakpoints(await r.json());
        const rc = await fetchWithAuth("/breakpoints/count");
        if (rc.ok) { const d = await rc.json(); setBpCount(d.count); }
    }, [bpFilter, bpPage]);

    useEffect(() => { if (tab === "breakpoints") fetchBreakpoints(); }, [tab, fetchBreakpoints]);

    const addBreakpoint = async () => {
        if (!newBp.standard_id || !newBp.microbe_id || !newBp.antibiotic_id) { setBpError("กรุณาเลือก Standard, เชื้อ, และยา"); return; }
        setBpError("");
        const body = {
            standard_id: parseInt(newBp.standard_id), microbe_id: parseInt(newBp.microbe_id), antibiotic_id: parseInt(newBp.antibiotic_id),
            susceptible_min_mm: newBp.susceptible_min_mm ? parseInt(newBp.susceptible_min_mm) : null,
            intermediate_min_mm: newBp.intermediate_min_mm ? parseInt(newBp.intermediate_min_mm) : null,
            intermediate_max_mm: newBp.intermediate_max_mm ? parseInt(newBp.intermediate_max_mm) : null,
            resistant_max_mm: newBp.resistant_max_mm ? parseInt(newBp.resistant_max_mm) : null,
        };
        const r = await fetchWithAuth("/breakpoints", { method: "POST", body: JSON.stringify(body) });
        if (r.ok) {
            setNewBp({ standard_id: "", microbe_id: "", antibiotic_id: "", susceptible_min_mm: "", intermediate_min_mm: "", intermediate_max_mm: "", resistant_max_mm: "" });
            setAbSearch(""); fetchBreakpoints();
        } else { const e = await r.json(); setBpError(e.detail || "Error"); }
    };

    const saveBp = async () => {
        if (!editBp) return;
        const r = await fetchWithAuth(`/breakpoints/${editBp.breakpoint_id}`, {
            method: "PUT", body: JSON.stringify({
                susceptible_min_mm: editBp.susceptible_min_mm, intermediate_min_mm: editBp.intermediate_min_mm,
                intermediate_max_mm: editBp.intermediate_max_mm, resistant_max_mm: editBp.resistant_max_mm,
            })
        });
        if (r.ok) { setEditBp(null); fetchBreakpoints(); }
    };

    const deleteBp = async (id: number) => {
        if (!confirm("ลบ Breakpoint นี้?")) return;
        await fetchWithAuth(`/breakpoints/${id}`, { method: "DELETE" });
        fetchBreakpoints();
    };

    const numInput = (val: any, onChange: (v: any) => void) => (
        <input type="number" value={val ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : parseInt(e.target.value))} className={`${inputCls} w-16 text-center`} />
    );

    const pagedMicrobes = microbes.slice(microbePage * MB_PAGE_SIZE, (microbePage + 1) * MB_PAGE_SIZE);
    const totalMicrobePages = Math.max(1, Math.ceil(microbes.length / MB_PAGE_SIZE));
    const pagedAntibiotics = antibiotics.slice(abPage * AB_PAGE_SIZE, (abPage + 1) * AB_PAGE_SIZE);
    const totalAbPages = Math.max(1, Math.ceil(antibiotics.length / AB_PAGE_SIZE));
    const totalBpPages = Math.max(1, Math.ceil(bpCount / BP_PAGE_SIZE));

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
            <h1 className={`text-3xl mb-6 ${isDark ? "text-gray-100" : "text-gray-900"}`}>จัดการข้อมูล</h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {(["microbes", "antibiotics", "standards", "breakpoints"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${tab === t ? tabActiveStyle : tabStyle}`}>
                        {{ microbes: "🦠 เชื้อ", antibiotics: "💊 ยา", standards: "📋 Standard", breakpoints: "📐 Breakpoints (SIR)" }[t]}
                    </button>
                ))}
            </div>

            {/* ========== MICROBES ========== */}
            {tab === "microbes" && (
                <Card className={cardCls}>
                    <h2 className={`text-xl mb-4 ${isDark ? "text-gray-100" : "text-gray-900"}`}>รายการเชื้อ ({microbes.length})</h2>
                    <div className="flex gap-2 mb-4">
                        <Input placeholder="ชื่อเชื้อใหม่..." value={newMicrobeName} onChange={(e) => setNewMicrobeName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMicrobe()} className={isDark ? "bg-gray-800 border-gray-600 text-gray-100" : ""} />
                        <Button onClick={addMicrobe} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"><Plus className="w-4 h-4 mr-1" /> เพิ่ม</Button>
                    </div>
                    {microbeError && <p className="text-red-400 text-sm mb-3">{microbeError}</p>}
                    <div className={tableWrap}>
                        <div className={tableScroll}>
                            <table className="w-full">
                                <thead className="sticky top-0 z-10">
                                    <tr><th className={thCls}>ID</th><th className={thCls}>ชื่อเชื้อ</th><th className={`${thCls} text-right`}>จัดการ</th></tr>
                                </thead>
                                <tbody>
                                    {pagedMicrobes.map((m) => (
                                        <tr key={m.microbe_id} className={rowCls}>
                                            <td className={`${tdCls} w-16 text-gray-500`}>{m.microbe_id}</td>
                                            <td className={tdCls}>
                                                {editMicrobe?.id === m.microbe_id
                                                    ? <input value={editMicrobe.name} onChange={(e) => setEditMicrobe({ ...editMicrobe, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && saveMicrobe()} className={`${inputCls} w-full`} />
                                                    : m.strain_name}
                                            </td>
                                            <td className={`${tdCls} text-right`}>
                                                {editMicrobe?.id === m.microbe_id ? (
                                                    <div className="flex gap-1 justify-end">
                                                        <Button size="sm" onClick={saveMicrobe} className="bg-green-600 hover:bg-green-700 text-white h-7 px-2"><Check className="w-3 h-3" /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditMicrobe(null)} className="h-7 px-2"><X className="w-3 h-3" /></Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1 justify-end">
                                                        <Button size="sm" variant="ghost" onClick={() => setEditMicrobe({ id: m.microbe_id, name: m.strain_name })} className={`h-7 px-2 ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}><Pencil className="w-3 h-3" /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => deleteMicrobe(m.microbe_id)} className="h-7 px-2 hover:bg-red-900/30 text-red-400"><Trash2 className="w-3 h-3" /></Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                        <Button size="sm" variant="outline" onClick={() => setMicrobePage(p => Math.max(0, p - 1))} disabled={microbePage === 0}>← ก่อนหน้า</Button>
                        <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>หน้า {microbePage + 1} / {totalMicrobePages} ({microbes.length} รายการ)</span>
                        <Button size="sm" variant="outline" onClick={() => setMicrobePage(p => p + 1)} disabled={microbePage + 1 >= totalMicrobePages}>ถัดไป →</Button>
                    </div>
                </Card>
            )}

            {/* ========== ANTIBIOTICS ========== */}
            {tab === "antibiotics" && (
                <Card className={cardCls}>
                    <h2 className={`text-xl mb-4 ${isDark ? "text-gray-100" : "text-gray-900"}`}>รายการยา ({antibiotics.length})</h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Input placeholder="ชื่อยา..." value={newAb.name} onChange={(e) => setNewAb({ ...newAb, name: e.target.value })} className={`flex-1 min-w-[180px] ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : ""}`} />
                        <Input placeholder="ชื่อย่อ" value={newAb.abbreviation} onChange={(e) => setNewAb({ ...newAb, abbreviation: e.target.value })} className={`w-28 ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : ""}`} />
                        <Input type="number" placeholder="µg" value={newAb.concentration_ug} onChange={(e) => setNewAb({ ...newAb, concentration_ug: e.target.value })} className={`w-20 ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : ""}`} />
                        <Button onClick={addAntibiotic} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"><Plus className="w-4 h-4 mr-1" /> เพิ่ม</Button>
                    </div>
                    <div className={tableWrap}>
                        <div className={tableScroll}>
                            <table className="w-full">
                                <thead className="sticky top-0 z-10">
                                    <tr><th className={thCls}>ID</th><th className={thCls}>ชื่อยา</th><th className={thCls}>ชื่อย่อ</th><th className={thCls}>µg</th><th className={`${thCls} text-right`}>จัดการ</th></tr>
                                </thead>
                                <tbody>
                                    {pagedAntibiotics.map((ab) => (
                                        <tr key={ab.antibiotic_id} className={rowCls}>
                                            <td className={`${tdCls} w-12 text-gray-500`}>{ab.antibiotic_id}</td>
                                            <td className={tdCls}>{editAb?.id === ab.antibiotic_id ? <input value={editAb.name} onChange={(e) => setEditAb({ ...editAb, name: e.target.value })} className={`${inputCls} w-full`} /> : ab.name}</td>
                                            <td className={tdCls}>{editAb?.id === ab.antibiotic_id ? <input value={editAb.abbreviation} onChange={(e) => setEditAb({ ...editAb, abbreviation: e.target.value })} className={`${inputCls} w-20`} /> : <span className="font-mono text-blue-400">{ab.abbreviation || "-"}</span>}</td>
                                            <td className={tdCls}>{editAb?.id === ab.antibiotic_id ? <input type="number" value={editAb.concentration_ug} onChange={(e) => setEditAb({ ...editAb, concentration_ug: parseInt(e.target.value) || 0 })} className={`${inputCls} w-16`} /> : ab.concentration_ug}</td>
                                            <td className={`${tdCls} text-right`}>
                                                {editAb?.id === ab.antibiotic_id ? (
                                                    <div className="flex gap-1 justify-end">
                                                        <Button size="sm" onClick={saveAntibiotic} className="bg-green-600 hover:bg-green-700 text-white h-7 px-2"><Check className="w-3 h-3" /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditAb(null)} className="h-7 px-2"><X className="w-3 h-3" /></Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1 justify-end">
                                                        <Button size="sm" variant="ghost" onClick={() => setEditAb({ id: ab.antibiotic_id, name: ab.name, abbreviation: ab.abbreviation || "", concentration_ug: ab.concentration_ug })} className={`h-7 px-2 ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}><Pencil className="w-3 h-3" /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => deleteAntibiotic(ab.antibiotic_id)} className="h-7 px-2 hover:bg-red-900/30 text-red-400"><Trash2 className="w-3 h-3" /></Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                        <Button size="sm" variant="outline" onClick={() => setAbPage(p => Math.max(0, p - 1))} disabled={abPage === 0}>← ก่อนหน้า</Button>
                        <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>หน้า {abPage + 1} / {totalAbPages} ({antibiotics.length} รายการ)</span>
                        <Button size="sm" variant="outline" onClick={() => setAbPage(p => p + 1)} disabled={abPage + 1 >= totalAbPages}>ถัดไป →</Button>
                    </div>
                </Card>
            )}

            {/* ========== STANDARDS ========== */}
            {tab === "standards" && (
                <Card className={cardCls}>
                    <h2 className={`text-xl mb-4 ${isDark ? "text-gray-100" : "text-gray-900"}`}>รายการ Standard ({standards.length})</h2>
                    <div className="flex gap-2 mb-4">
                        <Input placeholder="ชื่อ Standard (เช่น EUCAST)" value={newStd.standard_name} onChange={(e) => setNewStd({ ...newStd, standard_name: e.target.value })} className={`flex-1 ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : ""}`} />
                        <Input placeholder="Version (เช่น 2024)" value={newStd.standard_version} onChange={(e) => setNewStd({ ...newStd, standard_version: e.target.value })} className={`w-36 ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : ""}`} />
                        <Button onClick={addStandard} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"><Plus className="w-4 h-4 mr-1" /> เพิ่ม</Button>
                    </div>
                    <div className={tableWrap}>
                        <table className="w-full">
                            <thead>
                                <tr><th className={thCls}>ID</th><th className={thCls}>ชื่อ Standard</th><th className={thCls}>Version</th><th className={`${thCls} text-right`}>จัดการ</th></tr>
                            </thead>
                            <tbody>
                                {standards.map((s) => (
                                    <tr key={s.standard_id} className={rowCls}>
                                        <td className={`${tdCls} w-12 text-gray-500`}>{s.standard_id}</td>
                                        <td className={tdCls}>{editStd?.id === s.standard_id ? <input value={editStd.name} onChange={(e) => setEditStd({ ...editStd, name: e.target.value })} className={`${inputCls} w-full`} /> : <span className="font-semibold">{s.standard_name}</span>}</td>
                                        <td className={tdCls}>{editStd?.id === s.standard_id ? <input value={editStd.version} onChange={(e) => setEditStd({ ...editStd, version: e.target.value })} className={`${inputCls} w-28`} /> : s.standard_version}</td>
                                        <td className={`${tdCls} text-right`}>
                                            {editStd?.id === s.standard_id ? (
                                                <div className="flex gap-1 justify-end">
                                                    <Button size="sm" onClick={saveStandard} className="bg-green-600 hover:bg-green-700 text-white h-7 px-2"><Check className="w-3 h-3" /></Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditStd(null)} className="h-7 px-2"><X className="w-3 h-3" /></Button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1 justify-end">
                                                    <Button size="sm" variant="ghost" onClick={() => setEditStd({ id: s.standard_id, name: s.standard_name, version: s.standard_version })} className={`h-7 px-2 ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}><Pencil className="w-3 h-3" /></Button>
                                                    <Button size="sm" variant="ghost" onClick={() => deleteStandard(s.standard_id)} className="h-7 px-2 hover:bg-red-900/30 text-red-400"><Trash2 className="w-3 h-3" /></Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* ========== BREAKPOINTS ========== */}
            {tab === "breakpoints" && (
                <Card className={cardCls}>
                    <h2 className={`text-xl mb-2 ${isDark ? "text-gray-100" : "text-gray-900"}`}>Breakpoints (SIR mm) — ทั้งหมด {bpCount} รายการ</h2>
                    <p className={`text-xs mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        S = Susceptible (mm ≥ S_min) &nbsp;|&nbsp; I = Intermediate (I_min ≤ mm ≤ I_max) &nbsp;|&nbsp; R = Resistant (mm ≤ R_max)
                    </p>

                    {/* Filter */}
                    <div className="flex flex-wrap gap-2 mb-4 items-center">
                        <select value={bpFilter.microbe_id} onChange={(e) => { setBpFilter({ ...bpFilter, microbe_id: e.target.value }); setBpPage(0); }} className={selCls}>
                            <option value="">— ทุกเชื้อ —</option>
                            {microbes.map((m) => <option key={m.microbe_id} value={m.microbe_id}>{m.strain_name}</option>)}
                        </select>
                        <select value={bpFilter.standard_id} onChange={(e) => { setBpFilter({ ...bpFilter, standard_id: e.target.value }); setBpPage(0); }} className={selCls}>
                            <option value="">— ทุก Standard —</option>
                            {standards.map((s) => <option key={s.standard_id} value={s.standard_id}>{s.standard_name}</option>)}
                        </select>
                        <Button size="sm" onClick={fetchBreakpoints} variant="outline" className="h-8">โหลด</Button>
                    </div>

                    {/* Add new breakpoint */}
                    <div className={`rounded-lg border p-3 mb-4 ${isDark ? "border-gray-700 bg-gray-800/40" : "border-gray-200 bg-gray-50"}`}>
                        <p className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>➕ เพิ่ม Breakpoint ใหม่</p>
                        <div className="flex flex-wrap gap-2 items-start">
                            <select value={newBp.standard_id} onChange={(e) => setNewBp({ ...newBp, standard_id: e.target.value })} className={selCls}>
                                <option value="">Standard</option>
                                {standards.map((s) => <option key={s.standard_id} value={s.standard_id}>{s.standard_name}</option>)}
                            </select>
                            <select value={newBp.microbe_id} onChange={(e) => setNewBp({ ...newBp, microbe_id: e.target.value })} className={selCls}>
                                <option value="">เชื้อ</option>
                                {microbes.map((m) => <option key={m.microbe_id} value={m.microbe_id}>{m.strain_name}</option>)}
                            </select>
                            {/* Antibiotic: searchable text + datalist (no 500-option select) */}
                            <div className="flex flex-col gap-1">
                                <div className="flex gap-1 items-center">
                                    <input
                                        type="text"
                                        placeholder="ค้นหายา (ชื่อ/ชื่อย่อ)..."
                                        value={abSearch}
                                        onChange={(e) => { setAbSearch(e.target.value); setNewBp(prev => ({ ...prev, antibiotic_id: "" })); }}
                                        className={`${inputCls} w-48`}
                                        list="ab-datalist"
                                    />
                                    <datalist id="ab-datalist">
                                        {filteredAbs.map((a: any) => (
                                            <option key={a.antibiotic_id} value={`${a.name}${a.abbreviation ? ` (${a.abbreviation})` : ""}`} />
                                        ))}
                                    </datalist>
                                </div>
                                {abSearch && (() => {
                                    const match = antibiotics.find((a: any) =>
                                        abSearch === `${a.name}${a.abbreviation ? ` (${a.abbreviation})` : ""}` ||
                                        abSearch.toLowerCase() === (a.abbreviation || "").toLowerCase() ||
                                        abSearch.toLowerCase() === a.name.toLowerCase()
                                    );
                                    if (match && newBp.antibiotic_id !== String(match.antibiotic_id)) {
                                        setTimeout(() => setNewBp(prev => ({ ...prev, antibiotic_id: String(match.antibiotic_id) })), 0);
                                    }
                                    return match
                                        ? <span className="text-xs text-green-400">✓ {match.name} (ID: {match.antibiotic_id})</span>
                                        : <span className="text-xs text-gray-400">พิมพ์แล้วเลือกจาก dropdown</span>;
                                })()}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-green-500 font-bold">S≥</span>
                                <input type="number" value={newBp.susceptible_min_mm} onChange={(e) => setNewBp({ ...newBp, susceptible_min_mm: e.target.value })} placeholder="mm" className={`${inputCls} w-14`} />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-yellow-500 font-bold">I</span>
                                <input type="number" value={newBp.intermediate_min_mm} onChange={(e) => setNewBp({ ...newBp, intermediate_min_mm: e.target.value })} placeholder="min" className={`${inputCls} w-14`} />
                                <span className="text-xs text-gray-400">-</span>
                                <input type="number" value={newBp.intermediate_max_mm} onChange={(e) => setNewBp({ ...newBp, intermediate_max_mm: e.target.value })} placeholder="max" className={`${inputCls} w-14`} />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-red-500 font-bold">R≤</span>
                                <input type="number" value={newBp.resistant_max_mm} onChange={(e) => setNewBp({ ...newBp, resistant_max_mm: e.target.value })} placeholder="mm" className={`${inputCls} w-14`} />
                            </div>
                            <Button onClick={addBreakpoint} className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-sm">เพิ่ม</Button>
                        </div>
                        {bpError && <p className="text-red-400 text-xs mt-2">{bpError}</p>}
                    </div>

                    {/* Breakpoints table */}
                    <div className={tableWrap}>
                        <div className={tableScroll}>
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 z-10">
                                    <tr>
                                        <th className={thCls}>Standard</th>
                                        <th className={thCls}>เชื้อ</th>
                                        <th className={thCls}>ยา</th>
                                        <th className={`${thCls} text-center text-green-500`}>S ≥</th>
                                        <th className={`${thCls} text-center text-yellow-500`}>I min</th>
                                        <th className={`${thCls} text-center text-yellow-500`}>I max</th>
                                        <th className={`${thCls} text-center text-red-500`}>R ≤</th>
                                        <th className={`${thCls} text-right`}>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakpoints.map((bp) => (
                                        <tr key={bp.breakpoint_id} className={rowCls}>
                                            <td className={`${tdCls} text-xs whitespace-nowrap`}>{bp.standard_name}</td>
                                            <td className={`${tdCls} whitespace-nowrap`}>{bp.strain_name}</td>
                                            <td className={tdCls}>
                                                <span className="font-medium">{bp.antibiotic_name}</span>
                                                {bp.antibiotic_abbrev && <span className="ml-1 font-mono text-xs text-blue-400">({bp.antibiotic_abbrev})</span>}
                                            </td>
                                            {editBp?.breakpoint_id === bp.breakpoint_id ? (
                                                <>
                                                    <td className="px-1 py-1 text-center">{numInput(editBp.susceptible_min_mm, (v) => setEditBp({ ...editBp, susceptible_min_mm: v }))}</td>
                                                    <td className="px-1 py-1 text-center">{numInput(editBp.intermediate_min_mm, (v) => setEditBp({ ...editBp, intermediate_min_mm: v }))}</td>
                                                    <td className="px-1 py-1 text-center">{numInput(editBp.intermediate_max_mm, (v) => setEditBp({ ...editBp, intermediate_max_mm: v }))}</td>
                                                    <td className="px-1 py-1 text-center">{numInput(editBp.resistant_max_mm, (v) => setEditBp({ ...editBp, resistant_max_mm: v }))}</td>
                                                    <td className={`${tdCls} text-right`}>
                                                        <div className="flex gap-1 justify-end">
                                                            <Button size="sm" onClick={saveBp} className="bg-green-600 hover:bg-green-700 text-white h-7 px-2"><Check className="w-3 h-3" /></Button>
                                                            <Button size="sm" variant="ghost" onClick={() => setEditBp(null)} className="h-7 px-2"><X className="w-3 h-3" /></Button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`${tdCls} text-center font-bold text-green-500`}>{bp.susceptible_min_mm ?? "—"}</td>
                                                    <td className={`${tdCls} text-center text-yellow-500`}>{bp.intermediate_min_mm ?? "—"}</td>
                                                    <td className={`${tdCls} text-center text-yellow-500`}>{bp.intermediate_max_mm ?? "—"}</td>
                                                    <td className={`${tdCls} text-center font-bold text-red-500`}>{bp.resistant_max_mm ?? "—"}</td>
                                                    <td className={`${tdCls} text-right`}>
                                                        <div className="flex gap-1 justify-end">
                                                            <Button size="sm" variant="ghost" onClick={() => setEditBp({ ...bp })} className={`h-7 px-2 ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}><Pencil className="w-3 h-3" /></Button>
                                                            <Button size="sm" variant="ghost" onClick={() => deleteBp(bp.breakpoint_id)} className="h-7 px-2 hover:bg-red-900/30 text-red-400"><Trash2 className="w-3 h-3" /></Button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center gap-3 mt-4">
                        <Button size="sm" variant="outline" onClick={() => setBpPage(p => Math.max(0, p - 1))} disabled={bpPage === 0}>← ก่อนหน้า</Button>
                        <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            หน้า {bpPage + 1} / {totalBpPages} ({bpCount} รายการ)
                        </span>
                        <Button size="sm" variant="outline" onClick={() => setBpPage(p => p + 1)} disabled={bpPage + 1 >= totalBpPages}>ถัดไป →</Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
