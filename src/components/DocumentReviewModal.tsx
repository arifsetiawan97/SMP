import React, { useEffect, useRef, useState } from 'react';
import type { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  Download,
  ExternalLink,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getPdfBlobUrl } from '../services/exportService';

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  doc: jsPDF | null;
  fileName: string;
  onDownloaded?: () => void;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  doc,
  fileName,
  onDownloaded,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [pageCount, setPageCount] = useState<number>(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isOpen || !doc) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    try {
      const url = getPdfBlobUrl(doc);
      setBlobUrl(url);
      setPageCount(doc.getNumberOfPages?.() || 1);
    } catch (err) {
      console.error('Gagal membuat URL pratinjau PDF:', err);
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, doc]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch (err) {
        console.warn('Iframe print access restricted, opening tab for print:', err);
      }
    }
    // Fallback: open in new window and print
    if (blobUrl) {
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    }
  };

  const handleDownload = () => {
    if (!doc) return;
    try {
      doc.save(fileName);
      setDownloadSuccess(true);
      if (onDownloaded) onDownloaded();
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Gagal mengunduh dokumen:', err);
    }
  };

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
              <Eye className="w-5 h-5 text-blue-300" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base truncate">{title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 shrink-0">
                  {pageCount} Halaman
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {subtitle || 'Periksa tata letak, data pengawas, dan tanda tangan sebelum mencetak atau mengunduh'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open in New Tab Button */}
            {blobUrl && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                title="Buka PDF di tab browser baru"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Tab Baru</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!blobUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors border border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Cetak</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={!doc}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: PDF Viewer / Embedded iframe */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden flex flex-col">
          {blobUrl ? (
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-300 shadow-inner bg-slate-200 relative">
              <iframe
                ref={iframeRef}
                src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                title={title}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Menyiapkan dokumen pratinjau...</p>
            </div>
          )}
        </div>

        {/* Bottom Status & Quick Action Bar */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-mono text-[11px] text-slate-700 truncate max-w-xs sm:max-w-md">
              {fileName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Format Siap Cetak (A4)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded-md text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
              >
                Unduh PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
