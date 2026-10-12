import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserConversions,
  getUserStoredFiles,
  retrieveFileBlob,
  deleteUserFile,
} from '../lib/cloudStorage';
import { downloadSingleFile } from '../lib/zipHelper';
import { ImagePreviewModal } from './ImagePreviewModal';
import type { ConversionRecord, StoredFile } from '../types';
import {
  Shield,
  FileText,
  FileImage,
  Download,
  Trash2,
  HardDrive,
  Clock,
  ArrowRight,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface HistoryVaultProps {
  initialSubTab?: 'vault' | 'history';
  onNavigateToConvert: (type: 'photo-to-pdf' | 'pdf-to-photo') => void;
}

export const HistoryVault: React.FC<HistoryVaultProps> = ({
  initialSubTab = 'vault',
  onNavigateToConvert,
}) => {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<'vault' | 'history'>(initialSubTab);
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; blob: Blob | null } | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [convList, fileList] = await Promise.all([
        getUserConversions(user.uid),
        getUserStoredFiles(user.uid),
      ]);
      setConversions(convList || []);
      setFiles(fileList || []);
    } catch (err) {
      console.error('Failed to load user vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleDownload = async (file: StoredFile) => {
    try {
      const blob = await retrieveFileBlob(file);
      downloadSingleFile(blob, file.fileName);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to download file');
    }
  };

  const handlePreview = async (file: StoredFile) => {
    try {
      if (file.thumbnailUrl) {
        setPreviewFile({ url: file.thumbnailUrl, name: file.fileName, blob: null });
        return;
      }
      const blob = await retrieveFileBlob(file);
      const url = URL.createObjectURL(blob);
      setPreviewFile({ url, name: file.fileName, blob });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to preview file');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this file from your vault?')) return;
    try {
      await deleteUserFile(user.uid, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const totalVaultSize = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0);

  const currentUid = user?.uid || 'guest_user';

  return (
    <div className="space-y-6">
      {/* Privacy Banner & User ID */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
            <Shield className="w-4 h-4 text-neutral-200" />
            <span>Strict User File Isolation Guaranteed</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
            Personal Cloud Storage & Conversion Logs
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            User ID: <span className="text-neutral-200">{currentUid}</span>
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6">
          <div>
            <p className="text-xs text-neutral-400">Vault Files</p>
            <p className="text-lg font-bold font-mono text-neutral-100 tabular-nums">
              {files.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Storage Used</p>
            <p className="text-lg font-bold font-mono text-neutral-100 tabular-nums">
              {formatBytes(totalVaultSize)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Total Batches</p>
            <p className="text-lg font-bold font-mono text-neutral-100 tabular-nums">
              {conversions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2 p-1 bg-neutral-900 rounded-xl border border-neutral-800">
          <button
            onClick={() => setSubTab('vault')}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'vault'
                ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Stored Files ({files.length})</span>
          </button>
          <button
            onClick={() => setSubTab('history')}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              subTab === 'history'
                ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Conversion History ({conversions.length})</span>
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          title="Refresh vault"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Vault Files Table */}
      {subTab === 'vault' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {files.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <HardDrive className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-sm font-medium text-neutral-200">No stored files yet</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Convert photos to PDF or PDFs to photos and they will be archived here in your personal cloud vault.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => onNavigateToConvert('photo-to-pdf')}
                  className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 rounded-lg text-xs font-medium transition-colors"
                >
                  Convert Photo to PDF
                </button>
                <button
                  onClick={() => onNavigateToConvert('pdf-to-photo')}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Convert PDF to Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">Document / File</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4 text-right">Size</th>
                    <th className="py-3 px-4">Date Saved</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {files.map((file) => {
                    const isPdf = file.fileType.includes('pdf');
                    return (
                      <tr key={file.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
                              {isPdf ? (
                                <FileText className="w-4 h-4" />
                              ) : (
                                <FileImage className="w-4 h-4" />
                              )}
                            </div>
                            <span className="font-medium text-neutral-200 truncate max-w-xs sm:max-w-md">
                              {file.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 uppercase text-neutral-400">
                          {isPdf ? 'PDF' : file.fileType.split('/')[1] || 'IMAGE'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-300 tabular-nums">
                          {formatBytes(file.sizeBytes)}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">
                          {new Date(file.createdAt).toLocaleDateString()} ·{' '}
                          {new Date(file.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isPdf && (
                              <button
                                onClick={() => handlePreview(file)}
                                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                                title="Preview image"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                              title="Download to device"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800"
                              title="Delete from vault"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Conversion History Table */}
      {subTab === 'history' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {conversions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Clock className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-sm font-medium text-neutral-200">No conversion history yet</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Completed batch operations will appear here with payload compression metrics and timestamps.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4">Quality / Preset</th>
                    <th className="py-3 px-4 text-right">Original Size</th>
                    <th className="py-3 px-4 text-right">Result Size</th>
                    <th className="py-3 px-4 text-right">Space Saved</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {conversions.map((conv) => {
                    const orig = conv.totalOriginalSizeBytes || 0;
                    const res = conv.totalResultSizeBytes || 0;
                    const savings = orig > res ? Math.round(((orig - res) / orig) * 100) : 0;

                    return (
                      <tr key={conv.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-neutral-200">
                          {conv.conversionType === 'photo-to-pdf' ? (
                            <span className="flex items-center gap-1.5 text-neutral-200">
                              <FileText className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Photo to PDF</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-neutral-200">
                              <FileImage className="w-3.5 h-3.5 text-neutral-400" />
                              <span>PDF to Photo</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-300">
                          {conv.outputSummary || `${conv.originalFilesCount} file(s)`}
                        </td>
                        <td className="py-3 px-4 text-neutral-400 capitalize">
                          {conv.compressionQuality || 'Standard'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-400 tabular-nums">
                          {formatBytes(orig)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-200 font-semibold tabular-nums">
                          {formatBytes(res)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {savings > 0 ? (
                            <span className="text-neutral-200 font-medium">-{savings}%</span>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">
                          {new Date(conv.createdAt).toLocaleDateString()} ·{' '}
                          {new Date(conv.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <ImagePreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          imageUrl={previewFile.url}
          title={previewFile.name}
          blob={previewFile.blob}
        />
      )}
    </div>
  );
};
