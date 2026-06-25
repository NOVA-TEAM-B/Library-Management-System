import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { FileText, Download, Play, Table, BarChart2, PieChart } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('books');
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [compiled, setCompiled] = useState(false);

  // Chart States
  const [chart1Data, setChart1Data] = useState<any>({ labels: [], series: [] });
  const [chart2Data, setChart2Data] = useState<any>({ labels: [], series: [] });

  const generateReport = async () => {
    setLoading(true);
    setCompiled(false);
    
    try {
      const token = localStorage.getItem('nova_jwt_token');
      const res = await fetch(`http://127.0.0.1:5000/api/reports/generate?type=${reportType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.msg);

      setColumns(data.columns);
      setRows(data.data);
      setCompiled(true);

      // Settle visual statistics
      calculateChartSeries(reportType, data.data);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateChartSeries = (type: string, dataRows: any[]) => {
    if (type === 'books') {
      let avail = 0, stock = 0;
      let categories: { [key: string]: number } = {};
      
      dataRows.forEach(r => {
        if (r.col5 === 'Available') avail += parseInt(r.col6);
        else stock += parseInt(r.col6);
        categories[r.col4] = (categories[r.col4] || 0) + parseInt(r.col6);
      });

      setChart1Data({
        labels: ['Available', 'Out of Stock'],
        series: [avail, stock]
      });

      setChart2Data({
        labels: Object.keys(categories),
        series: Object.values(categories)
      });
      
    } else if (type === 'members') {
      let active = 0, inactive = 0;
      let depts: { [key: string]: number } = {};
      
      dataRows.forEach(r => {
        if (r.col5 === 'active') active++;
        else inactive++;
        depts[r.col4] = (depts[r.col4] || 0) + 1;
      });

      setChart1Data({
        labels: ['Active', 'Inactive'],
        series: [active, inactive]
      });

      setChart2Data({
        labels: Object.keys(depts),
        series: Object.values(depts)
      });
      
    } else {
      // Loan / Transactions
      let statuses: { [key: string]: number } = {};
      dataRows.forEach(r => {
        statuses[r.col6] = (statuses[r.col6] || 0) + 1;
      });

      setChart1Data({
        labels: Object.keys(statuses),
        series: Object.values(statuses)
      });

      setChart2Data({
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        series: [dataRows.length * 0.3, dataRows.length * 0.4, dataRows.length * 0.1, dataRows.length * 0.2]
      });
    }
  };

  const handleExport = (format: string) => {
    const token = localStorage.getItem('nova_jwt_token');
    window.location.href = `http://127.0.0.1:5000/api/reports/export?type=${reportType}&format=${format}&Authorization=Bearer%20${token}`;
  };

  // Chart configs
  const donutOptions = (labels: string[]) => ({
    chart: { background: 'transparent' },
    colors: ['#10b981', '#ef4444', '#fbbf24', '#3b82f6', '#a855f7'],
    labels,
    legend: { labels: { colors: '#f8fafc' }, position: 'bottom' as const },
    stroke: { show: false },
    theme: { mode: 'dark' as const }
  });

  const barOptions = (labels: string[]) => ({
    chart: { toolbar: { show: false }, background: 'transparent' },
    colors: ['#0ea5e9'],
    xaxis: { categories: labels, labels: { style: { colors: '#94a3b8' } } },
    yaxis: { labels: { style: { colors: '#94a3b8' } } },
    grid: { borderColor: 'rgba(255,255,255,0.06)' },
    theme: { mode: 'dark' as const }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Configuration Header Card */}
      <div className="glass-panel p-5 border-white/10" data-aos="fade-up">
        <h4 className="text-white text-base font-semibold mb-4"><i className="fas fa-file-contract text-warning me-2"></i>Enterprise Report Compiler</h4>
        
        <div className="row g-3">
          <div className="col-md-5">
            <label className="text-white/60 text-xs font-semibold block mb-1">Select Compiler Target</label>
            <select
              value={reportType}
              onChange={(e) => { setReportType(e.target.value); setCompiled(false); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              style={{ background: '#1e3a8a' }}
            >
              <option value="books">Books Report (Inventory & ISBN)</option>
              <option value="members">Members Registry & Risk Analysis</option>
              <option value="issues">Lending Logs & Issues Ledger</option>
              <option value="reservations">Reservations Hold Queue</option>
              <option value="fines">Fine Invoices & Accounts Receivable</option>
            </select>
          </div>

          <div className="col-md-3 d-flex items-end">
            <button
              onClick={generateReport}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Play className="w-4 h-4" /> Compile Report
            </button>
          </div>

          <div className="col-md-4 d-flex items-end justify-end gap-2">
            {compiled && (
              <>
                <button
                  onClick={() => handleExport('csv')}
                  className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-glass text-xs py-2 px-3 text-white/80"
                >
                  Print
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* POWER BI CHARTS ROW */}
      {compiled && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="glass-panel p-5 border-white/10 h-[300px]">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1"><PieChart className="w-4 h-4 text-emerald-400" /> Status Distribution</h5>
            <div className="h-[210px] overflow-hidden flex justify-center items-center">
              <Chart options={donutOptions(chart1Data.labels)} series={chart1Data.series} type="donut" width="100%" height="80%" />
            </div>
          </div>

          <div className="glass-panel p-5 border-white/10 h-[300px]">
            <h5 className="text-white text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1"><BarChart2 className="w-4 h-4 text-cyan-400" /> Volume Breakdown</h5>
            <div className="h-[210px] overflow-hidden">
              <Chart options={barOptions(chart2Data.labels)} series={[{ name: 'Volume', data: chart2Data.series }]} type="bar" height="100%" />
            </div>
          </div>
        </div>
      )}

      {/* TABLE PREVIEW PANEL */}
      {compiled && (
        <div className="glass-panel p-5 border-white/10 animate-fade-in">
          <h4 className="text-white text-base font-semibold mb-4 flex items-center gap-2"><Table className="w-5 h-5 text-warning" /> Report Compiled Preview</h4>
          
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/50 uppercase tracking-wider text-[10px]">
                  {columns.map((col, idx) => <th key={idx} className="pb-3 font-semibold">{col}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 font-medium text-white">{row.col1}</td>
                    <td className="py-3.5">{row.col2}</td>
                    <td className="py-3.5">{row.col3}</td>
                    <td className="py-3.5">{row.col4}</td>
                    <td className="py-3.5">{row.col5}</td>
                    <td className="py-3.5">{row.col6}</td>
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
