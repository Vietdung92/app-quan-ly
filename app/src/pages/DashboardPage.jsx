/**
 * Dashboard Page
 * Path: src/pages/DashboardPage.jsx
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  CheckSquare,
  ArrowRight,
  Calendar,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';
import MyDashboardPage from './MyDashboardPage';
import VPWorkbenchPage from './VPWorkbenchPage';
import PerformanceBlock from '../components/dashboard/PerformanceBlock';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Kỹ thuật: tổng quan cá nhân, không thấy số liệu công ty
  if (user && !['QL', 'VP'].includes(user.role)) {
    return <MyDashboardPage />;
  }
  // Văn phòng: bàn làm việc — việc chờ xử lý thay vì biểu đồ
  if (user?.role === 'VP') {
    return <VPWorkbenchPage />;
  }
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalExpenses: 0,
    totalEmployees: 0,
    pendingTasks: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [expenseTrendData, setExpenseTrendData] = useState([]);
  const [projectStatusData, setProjectStatusData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const STATUS_LABELS = {
    pending: { label: 'Chưa bắt đầu', color: '#9ca3af' },
    in_progress: { label: 'Đang thực hiện', color: '#3b82f6' },
    on_hold: { label: 'Tạm dừng', color: '#f59e0b' },
    completed: { label: 'Hoàn thành', color: '#10b981' },
  };

  const monthLabel = (ym) => `Tháng ${parseInt(ym.split('-')[1])}`;

  const fetchChartData = async () => {
    // Lấy dữ liệu biểu đồ thật từ backend; lỗi từng biểu đồ không làm hỏng trang
    try {
      const res = await api.get('/dashboard/chart/expense-trend');
      if (res.data.success) {
        setExpenseTrendData(
          res.data.data.map((r) => ({ month: monthLabel(r.month), amount: r.amount }))
        );
      }
    } catch (e) { /* giữ trống */ }

    try {
      const res = await api.get('/dashboard/chart/project-status');
      if (res.data.success) {
        setProjectStatusData(
          res.data.data.map((r) => ({
            name: STATUS_LABELS[r.name]?.label || r.name,
            value: r.value,
            color: STATUS_LABELS[r.name]?.color,
          }))
        );
      }
    } catch (e) { /* giữ trống */ }

    try {
      const res = await api.get('/dashboard/chart/monthly');
      if (res.data.success) {
        setMonthlyData(
          res.data.data.map((r) => ({
            month: monthLabel(r.month), income: r.income, expenses: r.expenses,
          }))
        );
      }
    } catch (e) { /* giữ trống */ }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/dashboard/overview');
      if (response.data.success) {
        setStats(response.data.data.stats);
        setRecentActivities(response.data.data.activities || []);
        await fetchChartData();
      }
    } catch (error) {
      console.error('Fetch dashboard data error:', error);
      // Set mock data for development
      setStats({
        totalProjects: 12,
        totalExpenses: 24500000,
        totalEmployees: 5,
        pendingTasks: 8,
        monthlyIncome: 45000000,
        monthlyExpenses: 15000000,
      });
      setRecentActivities([
        {
          id: 1,
          type: 'project',
          description: 'Dự án thi công nội thất - Quận 2',
          date: '2024-08-28',
        },
        {
          id: 2,
          type: 'expense',
          description: 'Chi phí vật liệu xây dựng',
          date: '2024-08-27',
        },
        {
          id: 3,
          type: 'task',
          description: 'Kiểm tra căn hộ 101',
          date: '2024-08-26',
        },
      ]);

      // Mock chart data
      setExpenseTrendData([
        { month: 'Tháng 1', amount: 8000000 },
        { month: 'Tháng 2', amount: 9500000 },
        { month: 'Tháng 3', amount: 12000000 },
        { month: 'Tháng 4', amount: 11500000 },
        { month: 'Tháng 5', amount: 13200000 },
        { month: 'Tháng 6', amount: 15000000 },
      ]);

      setProjectStatusData([
        { name: 'Đang thực hiện', value: 7, color: '#3b82f6' },
        { name: 'Hoàn thành', value: 4, color: '#10b981' },
        { name: 'Tạm dừng', value: 1, color: '#f59e0b' },
      ]);

      setMonthlyData([
        { month: 'Tháng 1', income: 40000000, expenses: 8000000 },
        { month: 'Tháng 2', income: 42000000, expenses: 9500000 },
        { month: 'Tháng 3', income: 45000000, expenses: 12000000 },
        { month: 'Tháng 4', income: 43000000, expenses: 11500000 },
        { month: 'Tháng 5', income: 46000000, expenses: 13200000 },
        { month: 'Tháng 6', income: 45000000, expenses: 15000000 },
      ]);

      setDepartmentData([
        { name: 'Nội thất', value: 8500000 },
        { name: 'Kỹ thuật', value: 4200000 },
        { name: 'Quản lý', value: 6800000 },
        { name: 'Homestay', value: 3500000 },
        { name: 'Khác', value: 1500000 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, unit = '', trend = null, color = 'blue', to = null }) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
    };
    const Wrapper = to ? Link : 'div';

    return (
      <Wrapper {...(to ? { to } : {})} className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
              </h3>
              {unit && <span className="text-gray-500 text-sm">{unit}</span>}
            </div>
            {trend && (
              <div className={`flex items-center gap-1 mt-2 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp size={16} />
                <span className="text-xs">{trend.value}% so với tháng trước</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </Wrapper>
    );
  };

  const ActivityItem = ({ activity }) => {
    const typeIcons = {
      project: <CheckSquare size={18} className="text-blue-600" />,
      expense: <DollarSign size={18} className="text-orange-600" />,
      task: <CheckSquare size={18} className="text-green-600" />,
      leave: <Calendar size={18} className="text-purple-600" />,
    };

    const typeLabels = {
      project: 'Dự án',
      expense: 'Chi phí',
      task: 'Công việc',
      leave: 'Nghỉ phép',
    };

    return (
      <div className="flex items-center gap-4 py-3 border-b border-gray-200 last:border-b-0">
        <div className="bg-gray-100 p-2 rounded-lg">{typeIcons[activity.type] || typeIcons.task}</div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium truncate">{activity.description}</p>
          <p className="text-gray-500 text-xs">{new Date(activity.date).toLocaleDateString('vi-VN')}</p>
        </div>
        <ArrowRight size={18} className="text-gray-400" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Xin chào, {user?.full_name || 'Quản lý'}!
        </h1>
        <p className="text-gray-600 mt-1">Đây là bảng điều khiển quản lý công ty của bạn</p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={CheckSquare}
            title="Tổng Dự Án"
            value={stats.totalProjects}
            unit="dự án"
            color="blue"
            to="/projects"
          />
          <StatCard
            icon={DollarSign}
            title="Doanh Thu Tháng"
            value={Math.round(stats.monthlyIncome / 1000000)}
            unit="triệu đ"
            color="green"
            to={`/funds?type=Thu&month=${stats.month || ''}`}
            trend={stats.incomeChangePct != null ? { value: Math.abs(stats.incomeChangePct), positive: stats.incomeChangePct >= 0 } : null}
          />
          <StatCard
            icon={DollarSign}
            title="Chi Phí Tháng"
            value={Math.round(stats.monthlyExpenses / 1000000)}
            unit="triệu đ"
            color="orange"
            to={`/funds?type=Chi&month=${stats.month || ''}`}
            trend={stats.expenseChangePct != null ? { value: Math.abs(stats.expenseChangePct), positive: stats.expenseChangePct < 0 } : null}
          />
          <StatCard
            icon={Users}
            title="Nhân Viên"
            value={stats.totalEmployees}
            unit="người"
            color="purple"
            to="/employees"
          />
          <StatCard
            icon={CheckSquare}
            title="Công Việc Chưa Hoàn Thành"
            value={stats.pendingTasks}
            unit="công việc"
            color="blue"
            to="/tasks"
          />
          <StatCard
            icon={BarChart3}
            title="Số Dư Quỹ"
            value={Math.round((stats.fundBalance || 0) / 1000000)}
            unit="triệu đ"
            color="green"
            to="/funds"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Xu Hướng Chi Phí</h2>
          {expenseTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={expenseTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `${(value / 1000000).toFixed(1)}M đ`}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#f59e0b"
                  name="Chi phí"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-400">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Project Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trạng Thái Dự Án</h2>
          {projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-400">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Monthly Income vs Expenses */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Doanh Thu vs Chi Phí Hàng Tháng</h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `${(value / 1000000).toFixed(1)}M đ`}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Doanh thu" />
                <Bar dataKey="expenses" fill="#ef4444" name="Chi phí" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-400">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Hoạt Động Gần Đây</h2>
            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Xem tất cả
            </a>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-600">Chưa có hoạt động nào</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Hành Động Nhanh</h2>

          <div className="space-y-3">
            <a
              href="/projects/new"
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
            >
              <CheckSquare size={20} />
              <span className="font-medium">Tạo Dự Án</span>
            </a>

            <a
              href="/expenses/new"
              className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors"
            >
              <DollarSign size={20} />
              <span className="font-medium">Thêm Chi Phí</span>
            </a>

            <a
              href="/tasks/new"
              className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
            >
              <CheckSquare size={20} />
              <span className="font-medium">Thêm Công Việc</span>
            </a>

            <a
              href="/leaves/request"
              className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
            >
              <Calendar size={20} />
              <span className="font-medium">Xin Nghỉ Phép</span>
            </a>
          </div>
        </div>
      </div>

      {/* Hiệu suất nhân viên — chỉ Quản lý (VP đã rẽ sang Bàn Làm Việc) */}
      <PerformanceBlock />
    </div>
  );
}
