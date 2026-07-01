export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDate = (date, options = {}) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...options,
  }).format(new Date(date));
};

export const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year', secs: 31536000 }, { label: 'month', secs: 2592000 },
    { label: 'week', secs: 604800 }, { label: 'day', secs: 86400 },
    { label: 'hour', secs: 3600 }, { label: 'minute', secs: 60 },
  ];
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

export const getCategoryColor = (category) => {
  const colors = {
    document: '#2563EB', image: '#059669', video: '#DC2626',
    audio: '#D97706', archive: '#7C3AED', code: '#0891B2', other: '#6B7280',
  };
  return colors[category] || colors.other;
};

export const getCategoryIcon = (category) => {
  const icons = {
    document: 'FileText', image: 'Image', video: 'Video',
    audio: 'Music', archive: 'Archive', code: 'Code2', other: 'File',
  };
  return icons[category] || 'File';
};

export const getMimeIcon = (mimeType = '', name = '') => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return '📝';
  if (mimeType.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.csv')) return '📊';
  if (mimeType.includes('presentation') || name.endsWith('.pptx')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return '🗜️';
  if (mimeType.includes('javascript') || mimeType.includes('python') || mimeType.includes('html')) return '💻';
  return '📁';
};

export const truncate = (str, length = 30) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}…` : str;
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const CATEGORY_COLORS = {
  document: '#2563EB', image: '#059669', video: '#DC2626',
  audio: '#D97706', archive: '#7C3AED', code: '#0891B2', other: '#6B7280',
};

export const CHART_COLORS = ['#7C3AED', '#2563EB', '#059669', '#DC2626', '#D97706', '#0891B2', '#EC4899'];
