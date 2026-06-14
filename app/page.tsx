'use client';
// @ts-nocheck
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const COLORS = {
  'Performance Issue': '#E24B4A',
  'Functional Issue': '#D85A30',
  'Transaction Issue': '#EF9F27',
  'UI/UX Issue': '#7F77DD',
  'Customer Support Issue': '#1D9E75',
  'Security & Compliance Issue': '#A32D2D',
  'Feature Request': '#378ADD',
  'Positive Feedback': '#639922',
  'Unclassified': '#888780',
};

const SENTIMENT = {
  negative: '#E24B4A',
  neutral: '#EF9F27',
  positive: '#639922',
};

export default function Dashboard() {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchData(); }, [from, to]);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .gte('date', from)
      .lte('date', to + 'T23:59:59')
      .order('date', { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  const top10 = Object.entries(
    reviews.reduce((acc: Record<string,number>, r: any) => {
      const key = `${r.l1_category || 'Unclassified'} → ${r.l2_category || 'Unclear'}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 10)
   .map(([label, count]) => ({ label, count, l1: label.split(' → ')[0] }));

  const l1Data = Object.entries(
    reviews.reduce((acc, r) => {
      const c = r.l1_category || 'Unclassified';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => (b[1] as number) - (a[1] as number));

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Play Store Review Dashboard</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>HDFC Bank · classified by AI</p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>From <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          style={{ marginLeft: 8, padding: '5px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} /></label>
        <label style={{ fontSize: 13 }}>To <input type="date" value={to} onChange={e => setTo(e.target.value)}
          style={{ marginLeft: 8, padding: '5px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} /></label>
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => { setFrom(format(subDays(new Date(), d), 'yyyy-MM-dd')); setTo(format(new Date(), 'yyyy-MM-dd')); }}
            style={{ padding: '5px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'white' }}>
            Last {d}d
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total reviews', value: reviews.length },
          { label: 'Avg rating', value: avg + ' ★' },
          { label: 'Negative', value: reviews.filter(r => r.sentiment === 'negative').length },
          { label: 'Feature requests', value: reviews.filter(r => r.l1_category === 'Feature Request').length },
        ].map(k => (
          <div key={k.label} style={{ background: '#f7f7f5', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{loading ? '…' : k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: '16px 20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Top 10 issues</h2>
          {top10.length === 0 && <p style={{ fontSize: 13, color: '#999' }}>No data for this range.</p>}
          {top10.map((item, i) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#aaa', minWidth: 16 }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, marginBottom: 2 }}>{item.label}</div>
                <div style={{ height: 6, borderRadius: 3, background: '#f0f0f0' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: COLORS[item.l1] || '#888',
                    width: `${(item.count / (top10[0]?.count || 1)) * 100}%` }} />
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{item.count}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: '16px 20px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Category breakdown</h2>
          {l1Data.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={l1Data.map(([name, count]) => ({ name: name.replace(' Issue','').replace(' & Compliance',''), count }))}
                layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {l1Data.map(([name]) => <Cell key={name} fill={COLORS[name] || '#888'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: '16px 20px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>All reviews ({reviews.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                {['Date','Rating','L1','L2','Sentiment','Summary','Review','Source'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#555', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{r.date ? format(new Date(r.date), 'dd MMM') : '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{'★'.repeat(r.rating || 0)}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: (COLORS[r.l1_category] || '#888') + '22', color: COLORS[r.l1_category] || '#888',
                      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                      {r.l1_category || 'Unclassified'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#555' }}>{r.l2_category || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ color: SENTIMENT[r.sentiment] || '#888', fontSize: 11, fontWeight: 500 }}>{r.sentiment || '—'}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#555', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.summary || '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#888', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</td>
                  <td style={{ padding: '8px 12px', color: '#aaa', fontSize: 11 }}>{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 520, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>{selected.author}</strong>
              <span style={{ color: '#aaa', fontSize: 13 }}>{selected.date ? format(new Date(selected.date), 'dd MMM yyyy') : '—'}</span>
            </div>
            <div style={{ marginBottom: 12 }}>{'★'.repeat(selected.rating || 0)}{'☆'.repeat(5 - (selected.rating || 0))}</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{selected.text}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[selected.l1_category, selected.l2_category, selected.sentiment].filter(Boolean).map(tag => (
                <span key={tag} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, border: '1px solid #eee', color: '#555' }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}