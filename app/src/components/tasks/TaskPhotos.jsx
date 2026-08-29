/**
 * Task Photos - chụp/tải ảnh báo cáo công việc, tự gửi Telegram
 * Path: src/components/tasks/TaskPhotos.jsx
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Send } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function TaskPhotos({ taskId }) {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${taskId}/photos`);
      setPhotos(res.data.data);
    } catch { /* im lặng */ }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Ảnh tối đa 10MB');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const send = async () => {
    if (!file) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('note', note);
      await api.post(`/tasks/${taskId}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Đã gửi ảnh — Telegram nhóm sẽ nhận được');
      setFile(null); setPreview(null); setNote('');
      if (inputRef.current) inputRef.current.value = '';
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể gửi ảnh');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Camera size={18} className="text-blue-600" />
        Ảnh Báo Cáo
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        Chụp hoặc chọn ảnh — ảnh sẽ tự động gửi vào nhóm Telegram kèm chú thích.
      </p>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={pick}
          className="hidden"
          id={`photo-input-${taskId}`}
        />
        {!preview ? (
          <label
            htmlFor={`photo-input-${taskId}`}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-6 text-gray-500 cursor-pointer hover:border-blue-400 hover:text-blue-600"
          >
            <Camera size={20} />
            Chụp / Chọn Ảnh
          </label>
        ) : (
          <div className="space-y-3">
            <img src={preview} alt="preview" className="w-full max-h-64 object-contain rounded-lg bg-gray-50" />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field"
              placeholder="Ghi chú kèm ảnh (VD: Đã thay vòi mới xong)"
              maxLength={500}
            />
            <div className="flex gap-2">
              <button
                onClick={send}
                disabled={sending}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send size={16} />
                {sending ? 'Đang gửi...' : 'Gửi Ảnh + Telegram'}
              </button>
              <button
                onClick={() => { setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = ''; }}
                className="btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
            {photos.map((p) => (
              <a
                key={p.id}
                href={`/api/uploads/${p.filePath}`}
                target="_blank"
                rel="noreferrer"
                className="block"
                title={`${p.employeeName || ''} — ${p.note || ''}`}
              >
                <img
                  src={`/api/uploads/${p.filePath}`}
                  alt={p.note || 'ảnh công việc'}
                  className="w-full h-20 object-cover rounded-lg border border-gray-200"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
