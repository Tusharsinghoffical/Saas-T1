"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  FileText,
  MessageSquare,
  Paperclip,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

interface ActivityLogRecord {
  id: string;
  org_id: string;
  action: string;
  entity: string;
  entity_id: string;
  diff?: Record<string, any> | null;
  created_at: string;
  actor?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect Diff Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLogRecord | null>(null);

  const fetchLogs = React.useCallback(
    async (targetPage = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: "15",
        });
        if (entityFilter) params.set("entity", entityFilter);
        if (actionFilter) params.set("action", actionFilter);

        const res = await fetch(`/api/v1/activity?${params.toString()}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLogs(json.data);
          if (json.pagination) {
            setPage(json.pagination.page);
            setTotalPages(json.pagination.totalPages);
            setTotalCount(json.pagination.total);
          }
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    },
    [entityFilter, actionFilter]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ format: "csv" });
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/v1/activity?${params.toString()}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasq_activity_log_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes("created")) return <Badge variant="success">Created</Badge>;
    if (action.includes("updated")) return <Badge variant="warning">Updated</Badge>;
    if (action.includes("deleted")) return <Badge variant="urgent">Deleted</Badge>;
    if (action.includes("uploaded")) return <Badge variant="default">Uploaded</Badge>;
    return <Badge variant="default">{action}</Badge>;
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "tasks":
        return <FileText className="w-3.5 h-3.5 text-primary" />;
      case "task_comments":
        return <MessageSquare className="w-3.5 h-3.5 text-amber-500" />;
      case "task_attachments":
        return <Paperclip className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const actorName = log.actor?.full_name?.toLowerCase() || "";
    const action = log.action.toLowerCase();
    const entity = log.entity.toLowerCase();
    const diffStr = JSON.stringify(log.diff || {}).toLowerCase();
    return (
      actorName.includes(q) ||
      action.includes(q) ||
      entity.includes(q) ||
      diffStr.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Activity & Audit Trail
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
              {totalCount} events logged
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Immutable log of all user actions, task status changes, and data mutations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLogs(page)}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor, action, or diff content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Entities</option>
            <option value="tasks">Tasks</option>
            <option value="task_comments">Comments</option>
            <option value="task_attachments">Attachments</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Actions</option>
            <option value="task.created">Task Created</option>
            <option value="task.updated">Task Updated</option>
            <option value="task.deleted">Task Deleted</option>
            <option value="comment.created">Comment Created</option>
            <option value="attachment.uploaded">Attachment Uploaded</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Entity</th>
                <th className="py-3 px-4 font-semibold">Details / Diff</th>
                <th className="py-3 px-4 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/75 dark:hover:bg-slate-850/50 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        {log.actor?.full_name?.slice(0, 2).toUpperCase() || "US"}
                      </div>
                      <span>{log.actor?.full_name || "System"}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      {getEntityIcon(log.entity)}
                      <span>{log.entity}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate font-mono text-[11px]">
                    {JSON.stringify(log.diff || {})}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="p-1 rounded text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Inspect Diff"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No activity records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchLogs(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => fetchLogs(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Diff Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Action</span>
                <span className="font-semibold">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Actor</span>
                <span className="font-semibold">{selectedLog.actor?.full_name || "System"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Entity</span>
                <span className="font-semibold">{selectedLog.entity}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Timestamp</span>
                <span className="font-semibold">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-900 dark:text-white mb-1.5">
                Payload / Before-After Diff
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.diff, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
