/**
 * Projects Page
 * Path: src/pages/projects/ProjectsPage.jsx
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const isKT = user?.role === 'KT';
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/projects');
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      console.error('Fetch projects error:', error);
      toast.error('Không thể tải dự án');
      // Mock data for development
      setProjects([
        {
          id: 1,
          name: 'Thi công nội thất quận 2',
          description: 'Dự án thiết kế và thi công nội thất căn hộ',
          status: 'in_progress',
          budget: 50000000,
          spent: 35000000,
          startDate: '2024-08-01',
          endDate: '2024-09-30',
          manager: 'Nguyễn Văn A',
        },
        {
          id: 2,
          name: 'Quản lý homestay Đà Lạt',
          description: 'Cải thiện cơ sở vật chất homestay',
          status: 'completed',
          budget: 30000000,
          spent: 30000000,
          startDate: '2024-07-01',
          endDate: '2024-08-31',
          manager: 'Trần Thị B',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'in_progress':
        return <Clock size={18} className="text-blue-600" />;
      case 'on_hold':
        return <AlertCircle size={18} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Hoàn thành',
      in_progress: 'Đang thực hiện',
      on_hold: 'Tạm dừng',
      pending: 'Chưa bắt đầu',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dự Án</h1>
          <p className="text-gray-600 mt-1">Quản lý các dự án của công ty</p>
        </div>
        <Link to="/projects/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Tạo Dự Án
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chưa bắt đầu</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="on_hold">Tạm dừng</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tải dự án...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không tìm thấy dự án nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Tên Dự Án
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Ngân Sách
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Tiến Độ
                  </th>
                  {!isKT && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Ngân Sách
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        Tiến Độ
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Quản Lý
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const progress = (project.spent / project.budget) * 100;
                  return (
                    <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/projects/${project.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {project.name}
                        </Link>
                        <p className="text-gray-600 text-sm">{project.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(project.status)}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              project.status
                            )}`}
                          >
                            {getStatusLabel(project.status)}
                          </span>
                        </div>
                      </td>
                      {!isKT && (
                        <>
                          <td className="px-6 py-4 text-sm">
                            {(project.budget / 1000000).toFixed(1)}M đ
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-24">
                              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    progress > 90 ? 'bg-red-600' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {progress.toFixed(0)}%
                              </p>
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {project.manager}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
