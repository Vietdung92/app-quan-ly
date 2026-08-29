/**
 * Project Picker - ô gõ tên dự án có gợi ý tương đồng + tạo mới tại chỗ
 * Path: src/components/common/ProjectPicker.jsx
 *
 * Dùng thống nhất mọi nơi chọn dự án (chi phí, công việc, thu chi, bộ lọc).
 * props:
 *  - value: project id (string|number|'')
 *  - onChange(id, project)
 *  - allowCreate: cho phép "＋ Tạo dự án mới"
 *  - allowOffice: thêm lựa chọn đặc biệt "Văn phòng" (id='office')
 *  - placeholder, label, required
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Briefcase, Plus, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProjectPicker({
  value, onChange, allowCreate = true, allowOffice = false,
  label = 'Dự Án', placeholder = 'Gõ tên dự án...', required = false,
}) {
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch { /* im lặng */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Đóng gợi ý khi bấm ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const selected = value === 'office'
    ? { id: 'office', name: 'Văn phòng' }
    : projects.find((p) => String(p.id) === String(value));

  const norm = (str) => String(str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const matches = projects.filter((p) => norm(p.name).includes(norm(q)));
  const exact = projects.some((p) => norm(p.name) === norm(q.trim()));

  const pick = (id, project) => {
    onChange(id, project || null);
    setOpen(false);
    setQ('');
  };

  const createProject = async () => {
    const name = q.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await api.post('/projects', { name });
      const p = res.data.data;
      setProjects((list) => [p, ...list]);
      pick(String(p.id), p);
      toast.success(`Đã tạo dự án "${p.name}"`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Không thể tạo dự án');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <label className="label-field">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>

      {selected ? (
        <div className="input-field flex items-center justify-between gap-2 bg-blue-50 border-blue-300">
          <span className="flex items-center gap-2 min-w-0">
            <Briefcase size={15} className="text-blue-600 shrink-0" />
            <span className="truncate font-medium text-gray-900">{selected.name}</span>
          </span>
          <button type="button" onClick={() => pick('', null)} className="text-gray-400 hover:text-red-500 shrink-0">
            <X size={16} />
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="input-field"
          placeholder={placeholder}
        />
      )}

      {open && !selected && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {allowOffice && (
            <button
              type="button"
              onClick={() => pick('office', null)}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-700 border-b border-gray-100"
            >
              🏢 Văn phòng (không thuộc dự án)
            </button>
          )}
          {matches.slice(0, 8).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(String(p.id), p)}
              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm text-gray-800"
            >
              {p.name}
            </button>
          ))}
          {matches.length === 0 && q.trim() === '' && (
            <div className="px-3 py-2.5 text-sm text-gray-400">Gõ để tìm dự án...</div>
          )}
          {allowCreate && q.trim() && !exact && (
            <button
              type="button"
              onClick={createProject}
              disabled={creating}
              className="w-full text-left px-3 py-2.5 hover:bg-green-50 text-sm font-medium text-green-700 border-t border-gray-100 flex items-center gap-1.5"
            >
              <Plus size={15} />
              {creating ? 'Đang tạo...' : `Tạo dự án mới: "${q.trim()}"`}
            </button>
          )}
          {matches.length === 0 && q.trim() && !allowCreate && (
            <div className="px-3 py-2.5 text-sm text-gray-400">Không tìm thấy dự án</div>
          )}
        </div>
      )}
    </div>
  );
}
