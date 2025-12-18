import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Plus, Edit2, Trash2, RefreshCw, Calendar, Home, Database, TrendingUp } from 'lucide-react';

const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const CATEGORIES = ['Technology', 'Business', 'Science', 'Health', 'Entertainment', 'Sports'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
  const [filterCategory, setFilterCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', body: '', category: '', date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, searchTerm, sortConfig, filterCategory, dateRange]);

  const loadData = () => {
    const stored = localStorage.getItem('apiData');
    const sync = localStorage.getItem('lastSync');
    if (stored) {
      setData(JSON.parse(stored));
    }
    if (sync) {
      setLastSync(new Date(sync));
    }
  };

  const saveData = (newData) => {
    localStorage.setItem('apiData', JSON.stringify(newData));
    setData(newData);
  };

  const syncData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const apiData = await response.json();
      
      const existingData = [...data];
      const updatedData = apiData.slice(0, 30).map(item => {
        const existing = existingData.find(d => d.apiId === item.id);
        if (existing) {
          return { ...existing, title: item.title, body: item.body, updatedAt: new Date().toISOString() };
        }
        return {
          id: Date.now() + Math.random(),
          apiId: item.id,
          title: item.title,
          body: item.body,
          category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      });

      const mergedData = [...updatedData];
      existingData.forEach(item => {
        if (!item.apiId && !mergedData.find(d => d.id === item.id)) {
          mergedData.push(item);
        }
      });

      saveData(mergedData);
      const syncTime = new Date();
      setLastSync(syncTime);
      localStorage.setItem('lastSync', syncTime.toISOString());
      alert('✅ Data berhasil disinkronkan!');
    } catch (error) {
      alert('❌ Gagal sinkronisasi: ' + error.message);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(dateRange.start) && itemDate <= new Date(dateRange.end);
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(filtered);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ title: '', body: '', category: CATEGORIES[0], date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ title: item.title, body: item.body, category: item.category, date: item.date });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Yakin ingin menghapus data ini?')) {
      const newData = data.filter(item => item.id !== id);
      saveData(newData);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.body || !formData.category || !formData.date) {
      alert('⚠️ Semua field harus diisi!');
      return;
    }

    if (editingItem) {
      const newData = data.map(item =>
        item.id === editingItem.id
          ? { ...item, ...formData, updatedAt: new Date().toISOString() }
          : item
      );
      saveData(newData);
    } else {
      const newItem = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveData([...data, newItem]);
    }
    setIsModalOpen(false);
  };

  const getChartData = () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    let chartData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= oneMonthAgo;
    });

    if (dateRange.start && dateRange.end) {
      chartData = data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(dateRange.start) && itemDate <= new Date(dateRange.end);
      });
    }

    return chartData;
  };

  const getCategoryData = () => {
    const chartData = getChartData();
    const categoryCount = {};
    chartData.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });
    return Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
  };

  const getDateData = () => {
    const chartData = getChartData();
    const dateCount = {};
    chartData.forEach(item => {
      dateCount[item.date] = (dateCount[item.date] || 0) + 1;
    });
    return Object.entries(dateCount)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, count]) => ({ date, count }));
  };

  const getStats = () => {
    const chartData = getChartData();
    const categoryCount = getCategoryData();
    const topCategory = categoryCount.sort((a, b) => b.value - a.value)[0];
    const latest = chartData.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    return {
      total: chartData.length,
      topCategory: topCategory?.name || '-',
      latestDate: latest?.date || '-'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard Analitik API</h1>
          <p className="text-sm text-gray-600">Konsumsi API Publik & Visualisasi Data</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 flex items-center gap-2 transition ${activeTab === 'dashboard' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Home size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`px-4 py-2 flex items-center gap-2 transition ${activeTab === 'management' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Database size={18} />
            Manajemen Data
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Data</p>
                    <p className="text-3xl font-bold text-blue-600">{getStats().total}</p>
                  </div>
                  <TrendingUp className="text-blue-500" size={40} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Kategori Terbanyak</p>
                    <p className="text-xl font-bold text-green-600">{getStats().topCategory}</p>
                  </div>
                  <Database className="text-green-500" size={40} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Data Terbaru</p>
                    <p className="text-xl font-bold text-purple-600">{getStats().latestDate}</p>
                  </div>
                  <Calendar className="text-purple-500" size={40} />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span className="font-medium">Filter Tanggal:</span>
                </div>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span>-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-4">📊 Distribusi Kategori</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-4">📈 Agregasi Data per Tanggal</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getDateData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Jumlah Data" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'management' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    🕐 Terakhir Sync: {lastSync ? lastSync.toLocaleString('id-ID') : 'Belum pernah'}
                  </p>
                </div>
                <button
                  onClick={syncData}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400 transition shadow hover:shadow-lg"
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Syncing...' : 'Sync Data'}
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="🔍 Cari data..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border rounded px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Kategori</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 transition shadow hover:shadow-lg"
                >
                  <Plus size={18} />
                  Tambah Data
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('title')}>
                      Title {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('category')}>
                      Kategori {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('date')}>
                      Tanggal {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('updatedAt')}>
                      Last Updated {sortConfig.key === 'updatedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{item.title}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(item.updatedAt).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  📭 Tidak ada data. Klik "Sync Data" untuk mengambil data dari API.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? '✏️ Edit Data' : '➕ Tambah Data Baru'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan judul..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Body</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Masukkan deskripsi..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow hover:shadow-lg"
                >
                  💾 Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
