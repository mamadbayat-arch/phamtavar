import React, { useState, useEffect } from 'react';
import {
  X,
  Megaphone,
  Server,
  Cloud,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Key,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Brain,
  Database,
  Cpu,
  FileText,
} from 'lucide-react';
import { AdConfig, AppState, UserProfile } from '../types';
import { extractAiTrainingSamples, downloadAiDatasetFile, formatAsJsonL, AITrainingSample } from '../utils/aiDataset';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onRestoreState: (state: AppState) => void;
  userProfile?: UserProfile;
  onOpenUpdateModal?: (versionInfo: any) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  state,
  onRestoreState,
  userProfile,
  onOpenUpdateModal,
}) => {
  const [activeTab, setActiveTab] = useState<'ads' | 'server' | 'cloud' | 'ai'>('ads');

  // AI Dataset & Learning State
  const [aiStats, setAiStats] = useState<any>(null);
  const [isSyncingAi, setIsSyncingAi] = useState(false);
  const [aiSyncStatus, setAiSyncStatus] = useState<string | null>(null);

  // Ad State
  const [adConfig, setAdConfig] = useState<AdConfig>({
    active: true,
    title: 'نسخه جدید همتوار شخصی فعال شد!',
    description: 'امکان تشخیص خودکار پیامک‌های بانکی، ثبت مغایرت و پشتیبان‌گیری ابری هم‌اکنون در دسترس است.',
    ctaText: 'مشاهده امکانات',
    ctaUrl: 'https://hamtavar.ir',
    badge: 'ویژه',
  });
  const [isSavingAd, setIsSavingAd] = useState(false);
  const [adSaveStatus, setAdSaveStatus] = useState<string | null>(null);

  // Server & Version State
  const [serverVersionInfo, setServerVersionInfo] = useState<any>(null);
  const [isCheckingVersion, setIsCheckingVersion] = useState(false);
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [editVersion, setEditVersion] = useState('1.2.5');
  const [editVersionCode, setEditVersionCode] = useState(3);
  const [editMandatory, setEditMandatory] = useState(false);
  const [editChangelog, setEditChangelog] = useState(
    'سیستم خودکار بررسی و اطلاع‌رسانی نسخه جدید (Auto-Update)\nبهبود سرعت و رابط کاربری برنامه\nپشتیبان‌گیری ابری و تشخیص پیامک بانکی'
  );
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [versionSaveStatus, setVersionSaveStatus] = useState<string | null>(null);

  // SFTP State
  const [privateKey, setPrivateKey] = useState('');
  const [sftpPassword, setSftpPassword] = useState('');
  const [isUploadingSftp, setIsUploadingSftp] = useState(false);
  const [sftpStatus, setSftpStatus] = useState<string | null>(null);

  // Cloud Sync State
  const [cloudMobile, setCloudMobile] = useState(userProfile?.mobile || '');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load current ads
      fetch('/api/ads')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.ads) {
            setAdConfig(data.ads);
          }
        })
        .catch(() => {});

      // Load version info
      checkServerVersion();

      // Load AI stats
      fetchAiStats();
    }
  }, [isOpen]);

  const fetchAiStats = async () => {
    try {
      const res = await fetch('/api/ai/stats');
      const data = await res.json();
      if (data.success) {
        setAiStats(data);
      }
    } catch (e) {}
  };

  const handleSyncAiDatasetToServer = async () => {
    setIsSyncingAi(true);
    setAiSyncStatus(null);
    try {
      const samples = extractAiTrainingSamples(state);
      const res = await fetch('/api/ai/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSyncStatus(`✅ ${data.message}`);
        fetchAiStats();
      } else {
        setAiSyncStatus(`❌ ${data.message}`);
      }
    } catch (err: any) {
      setAiSyncStatus(`❌ خطا در اتصال به سرور: ${err.message}`);
    } finally {
      setIsSyncingAi(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAd(true);
    setAdSaveStatus(null);
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adConfig),
      });
      const data = await res.json();
      if (data.success) {
        setAdSaveStatus('تبلیغات با موفقیت ذخیره و در نرم‌افزار فعال شد.');
        setTimeout(() => setAdSaveStatus(null), 3000);
      } else {
        setAdSaveStatus(`خطا: ${data.message}`);
      }
    } catch (err: any) {
      setAdSaveStatus(`خطا در ارتباط با سرور: ${err.message}`);
    } finally {
      setIsSavingAd(false);
    }
  };

  const checkServerVersion = async () => {
    setIsCheckingVersion(true);
    try {
      const res = await fetch('/api/app/version');
      const data = await res.json();
      setServerVersionInfo(data);
      if (data.version) {
        setEditVersion(data.version);
        setEditVersionCode(data.versionCode || 3);
        setEditMandatory(!!data.isMandatory);
        if (data.changelog && Array.isArray(data.changelog)) {
          setEditChangelog(data.changelog.join('\n'));
        }
      }
    } catch (err) {
      setServerVersionInfo({
        version: '1.2.0',
        versionCode: 2,
        releaseDate: '۱۴۰۳/۰۷/۱۳',
        offline: true,
      });
    } finally {
      setIsCheckingVersion(false);
    }
  };

  const handleSaveVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVersion(true);
    setVersionSaveStatus(null);
    try {
      const payload = {
        version: editVersion.trim(),
        versionCode: Number(editVersionCode),
        releaseDate: '۱۴۰۳/۰۷/۱۴',
        isMandatory: editMandatory,
        changelog: editChangelog
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean),
        apkUrl: '/hamtavar-personal-debug.apk',
        sftpServer: {
          ip: '87.107.5.187',
          port: 22,
          username: 'hamtavar-personal',
          targetFolder: '/همتوار شخصی',
        },
      };

      const res = await fetch('/api/app/version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setServerVersionInfo(payload);
        setVersionSaveStatus('نسخه جدید در سرور ثبت شد. اکنون کاربران پیام اتوآپدیت دریافت می‌کنند.');
        setIsEditingVersion(false);
        setTimeout(() => setVersionSaveStatus(null), 4000);
      } else {
        setVersionSaveStatus(`خطا: ${data.message}`);
      }
    } catch (err: any) {
      setVersionSaveStatus(`خطا در ارتباط با سرور: ${err.message}`);
    } finally {
      setIsSavingVersion(false);
    }
  };

  const handleCloudSync = async () => {
    const cleanMobile = (cloudMobile || userProfile?.mobile || '').trim();
    if (!cleanMobile) {
      setCloudStatus('لطفاً شماره موبایل خود را مشخص کنید.');
      return;
    }

    setIsCloudSyncing(true);
    setCloudStatus(null);
    try {
      const res = await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: cleanMobile,
          state,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCloudStatus('✅ اطلاعات شما با موفقیت در فضای ابری سرور همگام‌سازی شد.');
      } else {
        setCloudStatus(`❌ خطا در ذخیره ابری: ${data.message}`);
      }
    } catch (err: any) {
      setCloudStatus('❌ عدم امکان برقراری ارتباط با سرور ابری.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCloudRestore = async () => {
    const cleanMobile = (cloudMobile || userProfile?.mobile || '').trim();
    if (!cleanMobile) {
      setCloudStatus('لطفاً شماره موبایل خود را برای بازیابی وارد کنید.');
      return;
    }

    if (!confirm('آیا مایلید اطلاعات فعلی با آخرین نسخه پشتیبان ابری این شماره جایگزین شود؟')) {
      return;
    }

    setIsCloudSyncing(true);
    setCloudStatus(null);
    try {
      const res = await fetch(`/api/cloud/restore/${cleanMobile}`);
      const data = await res.json();
      if (data.success && data.backup && data.backup.state) {
        onRestoreState(data.backup.state);
        setCloudStatus('✅ اطلاعات با موفقیت از سرور ابری بازیابی و اعمال شد.');
      } else {
        setCloudStatus(`❌ ${data.message || 'پشتیبانی در سرور یافت نشد.'}`);
      }
    } catch (err: any) {
      setCloudStatus('❌ خطا در ارتباط با سرور ابری.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleSftpUpload = async () => {
    if (!privateKey.trim() && !sftpPassword.trim()) {
      setSftpStatus('لطفاً محتوای کلید خصوصی (Private Key) یا رمز عبور سرور را وارد کنید.');
      return;
    }

    setIsUploadingSftp(true);
    setSftpStatus('در حال اتصال به 87.107.5.187:22 و آپلود در پوشه /همتوار شخصی...');
    try {
      const res = await fetch('/api/server/sftp-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privateKeyText: privateKey.trim(),
          password: sftpPassword.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSftpStatus(`✅ ${data.message}`);
      } else {
        setSftpStatus(`❌ ${data.message}`);
      }
    } catch (err: any) {
      setSftpStatus(`❌ خطا در ارتباط با سرور: ${err.message}`);
    } finally {
      setIsUploadingSftp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                پنل مدیریت تبلیغات، سرور و ابر همتوار
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تنظیم تبلیغات، استعلام نسخه و انتقال به سرور 87.107.5.187
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 px-4">
          <button
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'ads'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>مدیریت تبلیغات و بنر</span>
          </button>

          <button
            onClick={() => setActiveTab('server')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'server'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>سرور و SFTP دانلود</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'cloud'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>همگام‌سازی ابری</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>دیتاست هوش مصنوعی</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: AD MANAGEMENT */}
          {activeTab === 'ads' && (
            <form onSubmit={handleSaveAd} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    وضعیت نمایش تبلیغ در بالای برنامه
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    در صورت فعال بودن، بنر در بالای تمامی صفحات نمایش داده می‌شود.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adConfig.active}
                    onChange={e => setAdConfig({ ...adConfig, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    عنوان تبلیغ / تیتر
                  </label>
                  <input
                    type="text"
                    value={adConfig.title}
                    onChange={e => setAdConfig({ ...adConfig, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="مثلاً: تخفیف ویژه بهار همتوار"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    برچسب / نشان (Badge)
                  </label>
                  <input
                    type="text"
                    value={adConfig.badge || ''}
                    onChange={e => setAdConfig({ ...adConfig, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="مثلاً: ویژه، تخفیف، فوری"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  متن توضیحات تبلیغ
                </label>
                <textarea
                  rows={2}
                  value={adConfig.description}
                  onChange={e => setAdConfig({ ...adConfig, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  placeholder="توضیحات کوتاه جهت نمایش در بنر..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    متن دکمه (CTA)
                  </label>
                  <input
                    type="text"
                    value={adConfig.ctaText || ''}
                    onChange={e => setAdConfig({ ...adConfig, ctaText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="مثلاً: مشاهده و خرید"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    لینک کلیک (URL)
                  </label>
                  <input
                    type="url"
                    value={adConfig.ctaUrl || ''}
                    onChange={e => setAdConfig({ ...adConfig, ctaUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://hamtavar.ir/..."
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500">پیش‌نمایش زنده بنر:</span>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-sm flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        {adConfig.badge && (
                          <span className="px-1.5 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-black">
                            {adConfig.badge}
                          </span>
                        )}
                        <strong>{adConfig.title}</strong>
                      </div>
                      <p className="text-[11px] text-emerald-100">{adConfig.description}</p>
                    </div>
                  </div>
                  {adConfig.ctaUrl && (
                    <span className="px-2.5 py-1 rounded-lg bg-white text-emerald-800 text-[11px] font-bold flex-shrink-0">
                      {adConfig.ctaText || 'مشاهده'}
                    </span>
                  )}
                </div>
              </div>

              {adSaveStatus && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                  {adSaveStatus}
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingAd}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50"
              >
                {isSavingAd ? 'در حال ذخیره‌سازی...' : 'ذخیره و انتشار فوری تبلیغ در نرم‌افزار'}
              </button>
            </form>
          )}

          {/* TAB 2: SERVER & SFTP */}
          {activeTab === 'server' && (
            <div className="space-y-4">
              {/* Server Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      مشخصات سرور هدف (دانلود و استقرار)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                    آنلاین (Port 22 Open)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono" dir="ltr">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                    <span className="text-slate-400 block text-[10px]">HOST / IP:</span>
                    <strong>87.107.5.187</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                    <span className="text-slate-400 block text-[10px]">PORT:</span>
                    <strong>22 (SFTP / SSH)</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                    <span className="text-slate-400 block text-[10px]">USER:</span>
                    <strong>hamtavar-personal</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                    <span className="text-slate-400 block text-[10px]">FOLDER:</span>
                    <strong>/همتوار شخصی</strong>
                  </div>
                </div>
              </div>

              {/* Version Check & Auto-Update Configuration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        سیستم اتوآپدیت (نسخه کلاینت: ۱.۲.۰ | سرور: {serverVersionInfo?.version || '۱.۲.۵'})
                      </span>
                      <p className="text-[10px] text-slate-400">
                        کاربرانی که نسخه پایین‌تر دارند به صورت خودکار پیام به‌روزرسانی دریافت می‌کنند.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingVersion(!isEditingVersion)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                    >
                      {isEditingVersion ? 'بستن فرم' : 'تنظیم نسخه سرور'}
                    </button>

                    {onOpenUpdateModal && (
                      <button
                        type="button"
                        onClick={() => onOpenUpdateModal(serverVersionInfo || {
                          version: editVersion,
                          versionCode: editVersionCode,
                          isMandatory: editMandatory,
                          changelog: editChangelog.split('\n').filter(Boolean),
                          apkUrl: '/hamtavar-personal-debug.apk',
                        })}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-colors"
                        title="مشاهده مستقیم پاپ‌آپ به‌روزرسانی همان‌طور که کاربر می‌بیند"
                      >
                        تست پاپ‌آپ
                      </button>
                    )}
                  </div>
                </div>

                {isEditingVersion && (
                  <form onSubmit={handleSaveVersion} className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          شماره نسخه جدید (مثلاً ۱.۲.۵):
                        </label>
                        <input
                          type="text"
                          value={editVersion}
                          onChange={e => setEditVersion(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          کد نسخه (VersionCode عددی):
                        </label>
                        <input
                          type="number"
                          value={editVersionCode}
                          onChange={e => setEditVersionCode(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <input
                        type="checkbox"
                        id="mandatoryCheck"
                        checked={editMandatory}
                        onChange={e => setEditMandatory(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="mandatoryCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        به‌روزرسانی اجباری (کاربر تا آپدیت نکند نمی‌تواند پیام را ببندد)
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        لیست تغییرات نسخه جدید (هر تغییر در یک سطر):
                      </label>
                      <textarea
                        rows={3}
                        value={editChangelog}
                        onChange={e => setEditChangelog(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                        placeholder="قابلیت جدید ۱&#10;بهبود ۲..."
                      />
                    </div>

                    {versionSaveStatus && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                        {versionSaveStatus}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingVersion}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
                    >
                      {isSavingVersion ? 'در حال ثبت در سرور...' : 'ثبت نسخه جدید در سرور (فعال‌سازی اتوآپدیت)'}
                    </button>
                  </form>
                )}
              </div>

              {/* SFTP Upload Form */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>انتقال فایل APK نسخه جدید به سرور SFTP</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>کلید خصوصی سرور (Private Key) یا رمز عبور hamtavar-personal:</span>
                  </label>
                  <textarea
                    rows={3}
                    value={privateKey}
                    onChange={e => setPrivateKey(e.target.value)}
                    placeholder="محتوای فایل کلید (-----BEGIN OPENSSH PRIVATE KEY----- ...) را اینجا جای‌گذاری (Paste) کنید"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-slate-400">
                    یا در صورت ورود با رمز، رمز عبور کاربر سرور را در زیر وارد کنید:
                  </p>
                  <input
                    type="password"
                    value={sftpPassword}
                    onChange={e => setSftpPassword(e.target.value)}
                    placeholder="رمز عبور کاربر سرور (اختیاری اگر کلید دارید)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>

                {sftpStatus && (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold leading-relaxed border border-slate-200 dark:border-slate-800">
                    {sftpStatus}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSftpUpload}
                  disabled={isUploadingSftp}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploadingSftp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال انتقال فایل به سرور...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>ارسال فایل جدید APK به سرور 87.107.5.187</span>
                    </>
                  )}
                </button>

                {/* Direct CLI fallback snippet */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    یا اجرای مستقیم از طریق ترمینال لینوکس/مک:
                  </span>
                  <div className="p-2 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px] select-all overflow-x-auto text-left" dir="ltr">
                    scp -P 22 -i hamtavar-personal-final.key hamtavar-personal-debug.apk hamtavar-personal@87.107.5.187:"/همتوار شخصی/"
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLOUD SYNC & BACKUP */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>پشتیبان‌گیری ابری و جلوگیری از حذف اطلاعات</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  اگر گوشی شما گم شود، به سرقت برود یا دستگاه جدیدی خریداری کنید، با وارد کردن شماره همراه خود می‌توانید تمامی کارها، امور مالی، چک‌ها و عادات ثبت‌شده را مجدداً بازیابی نمایید.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  شماره موبایل جهت همگام‌سازی ابری:
                </label>
                <input
                  type="tel"
                  value={cloudMobile}
                  onChange={e => setCloudMobile(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                />
              </div>

              {cloudStatus && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  {cloudStatus}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCloudSync}
                  disabled={isCloudSyncing}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>پشتیبان‌گیری روی سرور</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloudRestore}
                  disabled={isCloudSyncing}
                  className="py-3 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>بازیابی از سرور</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p>
                  اطلاعات به صورت کدگذاری شده در مسیر اختصاصی سرور ذخیره می‌شود و تنها با شماره موبایل ثبت‌شده قابل دسترسی است.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: AI DATASET & LEARNING ENGINE */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {/* Introduction Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-emerald-500/10 border border-purple-200 dark:border-purple-800/60 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-bold text-xs">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>معماری موتور هوش مصنوعی و پایپ‌لاین آموزش (AI Learning Pipeline)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  معماری نرم‌افزار همتوار به شکلی مهندسی شده که تمامی ورودی‌های کاربر (دسته‌بندی پیامک‌های بانکی، اولویت‌بندی کارهای ماتریس آیزنهاور، مخارج و رفتار عادات) را با گمنام‌سازی امن، به ساختار استاندارد آموزش مدل‌های هوش مصنوعی (Fine-Tuning JSONL) تبدیل می‌کند.
                </p>
              </div>

              {/* Dataset Metrics */}
              {(() => {
                const localSamples = extractAiTrainingSamples(state);
                const taskSamples = localSamples.filter(s => s.domain === 'task_priority').length;
                const smsSamples = localSamples.filter(s => s.domain === 'sms_parsing').length;
                const financeSamples = localSamples.filter(s => s.domain === 'finance_categorization').length;
                const habitSamples = localSamples.filter(s => s.domain === 'habit_analytics').length;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-purple-600" />
                        <span>نمونه‌های آماده آموزش در این دستگاه: <strong>{localSamples.length} نمونه</strong></span>
                      </span>
                      {aiStats && (
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          تعداد نمونه‌های کل سرور: {aiStats.totalSamples}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block mb-0.5">اولویت‌بندی کارها</span>
                        <strong className="text-purple-600 dark:text-purple-400 font-bold text-sm">{taskSamples}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block mb-0.5">پیامک بانکی</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{smsSamples}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block mb-0.5">دسته‌بندی مالی</span>
                        <strong className="text-blue-600 dark:text-blue-400 font-bold text-sm">{financeSamples}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 block mb-0.5">تحلیل عادات</span>
                        <strong className="text-amber-600 dark:text-amber-400 font-bold text-sm">{habitSamples}</strong>
                      </div>
                    </div>

                    {/* Live JSONL Preview */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-purple-600" />
                          <span>فرمت خروجی آموزش مدل (Gemini / OpenAI Fine-Tuning JSONL):</span>
                        </span>
                        <span className="text-[10px] text-emerald-600">گمنام‌سازی امن اطلاعات شخصی</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[10px] max-h-36 overflow-y-auto overflow-x-auto text-left leading-relaxed select-all" dir="ltr">
                        {localSamples.length > 0 ? (
                          formatAsJsonL(localSamples.slice(0, 1))
                        ) : (
                          `{"messages":[{"role":"system","content":"دستیار هوش مصنوعی همتوار"},{"role":"user","content":"تحلیل تراکنش..."},{"role":"assistant","content":"{...}"}]}`
                        )}
                      </div>
                    </div>

                    {aiSyncStatus && (
                      <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 text-xs font-bold">
                        {aiSyncStatus}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => downloadAiDatasetFile(state, 'jsonl')}
                        className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>دانلود فایل دیتاست (JSONL)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSyncAiDatasetToServer}
                        disabled={isSyncingAi}
                        className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isSyncingAi ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>در حال ارسال نمونه‌ها...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-purple-600" />
                            <span>تجمیع نمونه‌ها در دیتابیس سرور</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Direct Server Download Link */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          دانلود تجمیعی کل نمونه‌های سرور:
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          مسیر مستقیم API برای آموزش مدل‌های پایتون: /api/ai/dataset
                        </p>
                      </div>
                      <a
                        href="/api/ai/dataset"
                        download="hamtavar-ai-training-dataset.jsonl"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>دانلود کل سرور</span>
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
