'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import {
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

interface Batch {
  batch_id: string;
  client_name: string;
  status: string;
  total_receipts: number;
  processed_receipts: number;
  total_amount: number;
  deductible_amount: number;
  review_count: number;
  created_at: string;
  completed_at: string;
}

interface CategoryData {
  category_id: string;
  category_name: string;
  receipt_count: number;
  total_amount: number;
  deductible_amount: number;
  non_deductible_amount: number;
  avg_confidence: number;
}

interface ComplianceIssue {
  receipt_id: string;
  receipt_date: string;
  vendor: string;
  amount: number;
  category_name: string;
  error_count: number;
  warning_count: number;
  compliance_errors: string[];
  compliance_warnings: string[];
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

export default function ReceiptDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedBatch]);

  const fetchDashboardData = async () => {
    try {
      // Fetch recent batches
      const batchesRes = await fetch('/api/receipts/batches?limit=10');
      const batchesData = await batchesRes.json();
      if (batchesData.success) {
        setBatches(batchesData.batches);
      }

      // Fetch category analytics
      const categoryUrl = selectedBatch
        ? `/api/receipts/analytics/categories?batch_id=${selectedBatch}`
        : '/api/receipts/analytics/categories';
      const categoryRes = await fetch(categoryUrl);
      const categoryDataRes = await categoryRes.json();
      if (categoryDataRes.success) {
        setCategoryData(categoryDataRes.categories);
      }

      // Fetch compliance issues
      const complianceUrl = selectedBatch
        ? `/api/receipts/analytics/compliance?batch_id=${selectedBatch}`
        : '/api/receipts/analytics/compliance';
      const complianceRes = await fetch(complianceUrl);
      const complianceDataRes = await complianceRes.json();
      if (complianceDataRes.success) {
        setComplianceIssues(complianceDataRes.compliance_issues);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const totalDeductible = categoryData.reduce(
    (sum, cat) => sum + parseFloat(cat.deductible_amount?.toString() || '0'),
    0
  );

  const totalNonDeductible = categoryData.reduce(
    (sum, cat) => sum + parseFloat(cat.non_deductible_amount?.toString() || '0'),
    0
  );

  const totalReceipts = categoryData.reduce(
    (sum, cat) => sum + cat.receipt_count,
    0
  );

  // Prepare chart data
  const pieChartData = categoryData.map((cat) => ({
    name: cat.category_name,
    value: parseFloat(cat.total_amount?.toString() || '0'),
  }));

  const barChartData = categoryData.map((cat) => ({
    name: cat.category_name.split(' ').slice(0, 2).join(' '), // Shorten names
    deductible: parseFloat(cat.deductible_amount?.toString() || '0'),
    nonDeductible: parseFloat(cat.non_deductible_amount?.toString() || '0'),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Receipt Processing Dashboard</h2>
          <p className="mt-1 text-sm text-gray-600">
            Real-time analytics and compliance monitoring
          </p>
        </div>
        <div>
          <select
            value={selectedBatch || ''}
            onChange={(e) => setSelectedBatch(e.target.value || null)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
          >
            <option value="">All Batches</option>
            {batches.map((batch) => (
              <option key={batch.batch_id} value={batch.batch_id}>
                {batch.client_name} - {new Date(batch.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Receipts</p>
              <p className="text-2xl font-bold text-gray-900">{totalReceipts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Deductible</p>
              <p className="text-2xl font-bold text-green-600">
                HKD {totalDeductible.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Non-Deductible</p>
              <p className="text-2xl font-bold text-gray-600">
                HKD {totalNonDeductible.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compliance Issues</p>
              <p className="text-2xl font-bold text-yellow-600">
                {complianceIssues.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <PieChartIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
          </div>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `HKD ${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              No data available
            </div>
          )}
        </div>

        {/* Bar Chart - Deductible vs Non-Deductible */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Deductible Breakdown</h3>
          </div>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: number) => `HKD ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="deductible" fill="#10B981" name="Deductible" />
                <Bar dataKey="nonDeductible" fill="#EF4444" name="Non-Deductible" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Batches */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Processing Batches</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Needs Review
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.map((batch) => (
                <tr key={batch.batch_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {batch.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        batch.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : batch.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : batch.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {batch.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {batch.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {batch.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {batch.processed_receipts} / {batch.total_receipts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    HKD {parseFloat(batch.total_amount?.toString() || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {batch.review_count > 0 ? (
                      <span className="text-yellow-600 font-medium">{batch.review_count}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {batch.status === 'completed' && (
                      <a
                        href={`/api/receipts/batches/${batch.batch_id}/download`}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Issues */}
      {complianceIssues.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Compliance Alerts</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complianceIssues.slice(0, 10).map((issue) => (
                  <tr key={issue.receipt_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(issue.receipt_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.vendor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      HKD {issue.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {issue.category_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        {issue.compliance_errors?.map((error, idx) => (
                          <div key={idx} className="text-red-600 text-xs">
                            ❌ {error}
                          </div>
                        ))}
                        {issue.compliance_warnings?.map((warning, idx) => (
                          <div key={idx} className="text-yellow-600 text-xs">
                            ⚠️  {warning}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
