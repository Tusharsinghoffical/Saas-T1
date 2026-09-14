"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Loader2,
  Sparkles,
  X,
  Users,
  ShieldCheck,
  Shield,
  Key,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface ParsedMember {
  fullName: string;
  email: string;
  role: "admin" | "manager" | "employee";
  password?: string;
}

interface BulkAddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function BulkAddMembersModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkAddMembersModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [defaultRole, setDefaultRole] = useState<"employee" | "manager">("employee");
  const [defaultPassword, setDefaultPassword] = useState("TasqOne@2026");
  const [pasteText, setPasteText] = useState("");
  const [parsedQueue, setParsedQueue] = useState<ParsedMember[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<{
    summary: { total: number; created: number; failed: number };
    results: Array<{
      email: string;
      fullName: string;
      role: string;
      password?: string;
      status: "created" | "failed";
      error?: string;
    }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseLineToMember = (line: string, fallbackRole: "employee" | "manager"): ParsedMember | null => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) return null;

    // Split on comma or semicolon or tab
    const parts = trimmed.split(/[,;\t]+/).map((p) => p.trim().replace(/^["']|["']$/g, ""));

    // Case A: Just email
    if (parts.length === 1 && EMAIL_REGEX.test(parts[0])) {
      const email = parts[0].toLowerCase();
      const name = email.split("@")[0].replace(/[._-]/g, " ");
      return {
        fullName: name.charAt(0).toUpperCase() + name.slice(1),
        email,
        role: fallbackRole,
      };
    }

    // Case B: Name, Email
    if (parts.length >= 2) {
      let name = parts[0];
      let email = parts[1];
      let role: "admin" | "manager" | "employee" = fallbackRole;
      let password: string | undefined = undefined;

      // Check if parts[0] is email instead of name
      if (EMAIL_REGEX.test(parts[0])) {
        email = parts[0];
        name = parts[1];
      }

      if (parts[2]) {
        const r = parts[2].toLowerCase();
        if (r === "manager" || r === "mgr") role = "manager";
        else if (r === "admin" || r === "adm") role = "admin";
        else role = "employee";
      }

      if (parts[3] && parts[3].length >= 6) {
        password = parts[3];
      }

      if (EMAIL_REGEX.test(email)) {
        return {
          fullName: name || email.split("@")[0],
          email: email.toLowerCase(),
          role,
          password,
        };
      }
    }

    return null;
  };

  const parseRawText = (text: string) => {
    setErrorMsg(null);
    const lines = text.split(/\r?\n/);
    const newItems: ParsedMember[] = [];
    const seenEmails = new Set(parsedQueue.map((q) => q.email));

    for (const line of lines) {
      // Ignore header row
      if (line.toLowerCase().includes("email") && line.toLowerCase().includes("role")) {
        continue;
      }
      const item = parseLineToMember(line, defaultRole);
      if (item && !seenEmails.has(item.email)) {
        seenEmails.add(item.email);
        newItems.push(item);
      }
    }

    if (newItems.length === 0) {
      setErrorMsg("No valid email addresses found in the provided text/file.");
      return;
    }

    setParsedQueue((prev) => [...prev, ...newItems]);
    setPasteText("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("File is too large (max 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseRawText(content);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read file.");
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadDemoAccounts = () => {
    const demo = [
      "Aarav Sharma, aarav.sharma@company.com, manager",
      "Priya Patel, priya.patel@company.com, employee",
      "Rohan Verma, rohan.verma@company.com, employee",
      "Ananya Roy, ananya.roy@company.com, manager",
      "Vikram Malhotra, vikram.malhotra@company.com, employee",
    ].join("\n");
    parseRawText(demo);
  };

  const handleRemoveItem = (index: number) => {
    setParsedQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setParsedQueue([]);
    setErrorMsg(null);
    setResults(null);
  };

  const handleSubmit = async () => {
    if (parsedQueue.length === 0) {
      setErrorMsg("Please add at least one member to the list.");
      return;
    }

    if (!defaultPassword || defaultPassword.length < 6) {
      setErrorMsg("Default password must be at least 6 characters.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/team/bulk-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: parsedQueue,
          defaultPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to bulk add team members.");
      }

      setResults(json.data);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected network error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCredentialsCSV = () => {
    if (!results) return;
    const rows = [["Full Name", "Email", "Role", "Password", "Status", "Note"]];
    results.results.forEach((r) => {
      rows.push([
        r.fullName,
        r.email,
        r.role,
        r.password || defaultPassword,
        r.status,
        r.error || "Ready to log in",
      ]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `team_credentials_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setParsedQueue([]);
    setResults(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAll} title="Bulk Add Team Members" maxWidth="2xl">
      <div className="space-y-5">
        {/* Results Screen */}
        {results ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Bulk Creation Complete!</span>
              </div>
              <p className="mt-1 text-xs">
                Successfully created <strong>{results.summary.created}</strong> of {results.summary.total} members.
                {results.summary.failed > 0 && ` (${results.summary.failed} failed/skipped)`}
              </p>
            </div>

            {/* Credential List Table */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Password</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="p-2.5 font-medium text-slate-900 dark:text-white">{r.fullName}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">{r.email}</td>
                      <td className="p-2.5">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                          {r.role}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-primary font-bold">
                        {r.password || defaultPassword}
                      </td>
                      <td className="p-2.5">
                        {r.status === "created" ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
                        ) : (
                          <span className="text-urgent font-bold" title={r.error}>Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={downloadCredentialsCSV}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 transition"
              >
                <Download className="h-4 w-4" />
                <span>Download Credentials (CSV)</span>
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Close &amp; View Team
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-urgent/20 bg-urgent/10 p-3 text-xs font-semibold text-urgent">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Configuration Bar */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3.5 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Role for New Members
                </label>
                <select
                  value={defaultRole}
                  onChange={(e) => setDefaultRole(e.target.value as "employee" | "manager")}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 px-2.5 text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Initial Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
                    <Key className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    placeholder="e.g. TasqOne@2026"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 pl-8 pr-2.5 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Input Mode Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("file")}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === "file"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Upload className="h-4 w-4" />
                <span>Upload File (.CSV / .TXT)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("paste")}
                className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition ${
                  activeTab === "paste"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Paste Lines / Text</span>
              </button>
            </div>

            {/* Tab 1: File Upload */}
            {activeTab === "file" && (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-6 text-center hover:border-primary hover:bg-primary/5 transition"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.txt"
                    className="hidden"
                  />
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Click to select or drop a .CSV or .TXT file
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Supports comma, semicolon, or tab-delimited columns (Name, Email, Role, Password).
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Need an example file?</span>
                  <button
                    type="button"
                    onClick={handleLoadDemoAccounts}
                    className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Load 5 Demo Accounts</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Paste Lines */}
            {activeTab === "paste" && (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Paste lines in any of these formats:\nname, email, role\nalex@company.com\nPriya Patel, priya@company.com, manager, Secret@123`}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleLoadDemoAccounts}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Load Sample Text
                  </button>
                  <button
                    type="button"
                    onClick={() => parseRawText(pasteText)}
                    disabled={!pasteText.trim()}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-40 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Queue</span>
                  </button>
                </div>
              </div>
            )}

            {/* Parsed Queue Preview */}
            {parsedQueue.length > 0 && (
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Ready to Add: <span className="text-primary">{parsedQueue.length}</span> member(s)
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-slate-400 hover:text-urgent"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedQueue.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.fullName}
                        </span>
                        <span className="text-slate-400 truncate">({item.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={item.role}
                          onChange={(e) => {
                            const newRole = e.target.value as "employee" | "manager";
                            setParsedQueue((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, role: newRole } : p))
                            );
                          }}
                          className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-0.5 px-1.5 text-[10px] font-bold uppercase"
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-urgent"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={resetAll}
                disabled={isProcessing}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing || parsedQueue.length === 0}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50 transition shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating {parsedQueue.length} Accounts...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Create {parsedQueue.length} Member Accounts</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
