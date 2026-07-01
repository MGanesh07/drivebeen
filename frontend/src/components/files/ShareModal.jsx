import { useState } from 'react';
import { X, Share2, Mail, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { shareAPI } from '../../api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function ShareModal({ file, onClose, onShareComplete }) {
  const [activeTab, setActiveTab] = useState('people'); // 'people' or 'link'
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Link share state
  const [isPublic, setIsPublic] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShareWithPerson = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await shareAPI.shareFile({
        fileId: file._id,
        sharedWithEmail: email.trim(),
        permission,
        message: message.trim(),
        isPublic: false,
      });
      toast.success(`File shared with ${email}`);
      onShareComplete?.();
      setEmail('');
      setMessage('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share file');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const { data } = await shareAPI.shareFile({
        fileId: file._id,
        isPublic: true,
        permission: 'viewer',
      });
      setIsPublic(true);
      // Construct public link
      const publicLink = `${window.location.origin}/shared/${data.share.shareLink}`;
      setShareLink(publicLink);
      toast.success('Public link generated!');
      onShareComplete?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}>
      <div className="glass w-full max-w-md rounded-2xl shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-violet-800/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-900/50 flex items-center justify-center">
              <Share2 size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Share "{file.name}"</h2>
              <p className="text-xs text-[#6868a0]">Manage sharing and permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9898b8] hover:text-white hover:bg-violet-900/30 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 border-b border-violet-800/10">
          <button
            onClick={() => setActiveTab('people')}
            className={clsx(
              'flex-1 pb-3 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-2',
              activeTab === 'people'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-[#6868a0] hover:text-white'
            )}
          >
            <Mail size={13} /> Share with People
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={clsx(
              'flex-1 pb-3 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-2',
              activeTab === 'link'
                ? 'border-violet-500 text-white'
                : 'border-transparent text-[#6868a0] hover:text-white'
            )}
          >
            <LinkIcon size={13} /> General Access Link
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5">
          {activeTab === 'people' ? (
            <form onSubmit={handleShareWithPerson} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9898b8] mb-1.5">Email address</label>
                <input
                  type="email"
                  className="input-field w-full text-xs py-2.5"
                  placeholder="recipient@drivebeen.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9898b8] mb-1.5">Permission</label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="text-xs bg-[#141428] border border-violet-800/30 text-white rounded-xl w-full px-3 py-2.5 outline-none focus:border-violet-600 cursor-pointer"
                >
                  <option value="viewer">Viewer (Can download and preview only)</option>
                  <option value="editor">Editor (Can edit and manage file)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9898b8] mb-1.5">Message (Optional)</label>
                <textarea
                  className="input-field w-full text-xs py-2.5 h-20 resize-none"
                  placeholder="Add a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Share'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 py-2">
              {!isPublic ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-violet-900/30 flex items-center justify-center mx-auto">
                    <LinkIcon size={20} className="text-violet-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">Link sharing is restricted</p>
                    <p className="text-[10px] text-[#6868a0] max-w-xs mx-auto">Only people added explicitly can access this file via their account.</p>
                  </div>
                  <button
                    onClick={handleGenerateLink}
                    disabled={loading}
                    className="btn-primary text-xs py-2 px-4 mx-auto"
                  >
                    {loading ? 'Generating...' : 'Create Public Link'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check size={14} /> Anyone with this link can view
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareLink}
                      className="input-field flex-1 text-xs py-2 select-all font-mono opacity-80"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="btn-primary px-3 flex-shrink-0"
                      title="Copy Link"
                    >
                      {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#6868a0] leading-relaxed">
                    You can share this link with anyone, even if they don't have a DriveBeen account.
                  </p>
                  <div className="pt-4 flex justify-end">
                    <button onClick={onClose} className="btn-primary text-xs py-2 px-6">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
