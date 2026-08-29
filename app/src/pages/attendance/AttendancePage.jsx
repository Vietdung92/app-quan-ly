/**
 * Attendance Page
 * Path: src/pages/attendance/AttendancePage.jsx
 */

import { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().split('T')[0].slice(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth]);

  useEffect(() => {
    filterAttendance();
  }, [attendance, searchTerm]);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/attendance?month=${selectedMonth}`);
      if (response.data.success) {
        setAttendance(response.data.data);
      }
    } catch (error) {
      console.error('Fetch attendance error:', error);
      toast.error('Không thể tải điểm danh');
      // Mock data for development
      setAttendance([
        {
          id: 1,
          employeeId: 1,
          employeeName: 'Nguyễn Văn A',
          date: '2024-08-28',
          checkIn: '08:00',
          checkOut: '17:30',
          status: 'present',
          notes: '',
        },
        {
          id: 2,
          employeeId: 2,
          employeeName: 'Trần Thị B',
          date: '2024-08-28',
          checkIn: '08:15',
          checkOut: '17:45',
          status: 'late',
          notes: 'Đi muộn 15 phút',
        },
        {
          id: 3,
          employeeId: 3,
          employeeName: 'Lê Văn C',
          date: '2024-08-28',
          checkIn: null,
          checkOut: null,
          status: 'absent',
          notes: 'Vắng mặt',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAttendance = () => {
    let filtered = attendance;

    if (searchTerm) {
      filtered = filtered.filter((a) =>
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAttendance(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      present: { bg: 'bg-green-100', text: 'text-green-800', label: 'Có Mặt', icon: CheckCircle },
      late: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Đi Muộn', icon: AlertCircle },
      absent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Vắng Mặt', icon: AlertCircle },
      excused: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Được Phép', icon: CheckCircle },
    };
    return badges[status] || badges.present;
  };

  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    late: attendance.filter((a) => a.status === 'late').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Điểm Danh</h1>
        <p className="text-gray-600 mt-1">Theo dõi điểm danh nhân viên</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Tổng Nhân Viên</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Có Mặt</p>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Đi Muộn</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm mb-1">Vắng Mặt</p>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Đang tải điểm danh...</p>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600">Không có dữ liệu điểm danh</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Nhân Viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Vào Làm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Tan Làm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Ghi Chú
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => {
                  const badge = getStatusBadge(record.status);
                  return (
                    <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {record.employeeName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {record.checkIn || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {record.checkOut || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.notes || '-'}
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
