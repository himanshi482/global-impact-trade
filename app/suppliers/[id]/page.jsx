'use client';

// app/suppliers/[id]/page.jsx
// Stage 3 Phase 2 — /suppliers/[id]
// Uses the EXISTING /api/unlock endpoint — no second unlock system.

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

export default function SupplierProfilePage() {
  const { id } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [supplier, setSupplier] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [unlocking, setUnlocking] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | duplicate | error

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      // Adjust to your actual single-entity endpoint if different, e.g.
      // GET /api/suppliers/[id]. This assumes it returns { buyer, shipments }
      // with the same masking rules as /api/buyers/discover.
      const res = await fetch(`/api/suppliers/${id}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setSupplier(data.supplier);
      setShipments(data.shipments || []);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'SUPPLIER', entityId: id }),
      });
      if (res.status === 403) {
        alert('Your contact unlock limit has been reached.');
      } else if (!res.ok) {
        alert('Could not unlock contact details. Please try again.');
      } else {
        await load(); // refresh entity details to show unlocked fields
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handleSaveLead = async () => {
    setSaveState('saving');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'SUPPLIER',
          entityId: id,
          leadScore: supplier.leadScore,
        }),
      });
      if (res.status === 409) setSaveState('duplicate');
      else if (!res.ok) setSaveState('error');
      else setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  if (status === 'loading') {
    return <PageShell><p className="text-neutral-400">Loading supplier profile…</p></PageShell>;
  }
  if (status === 'error' || !supplier) {
    return (
      <PageShell>
        <p className="text-red-400">Could not load this supplier profile. Please try again.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">{supplier.companyName}</h1>
          <p className="text-neutral-400">{supplier.country}</p>
        </div>
        <button
          onClick={handleSaveLead}
          disabled={saveState === 'saving'}
          className="bg-yellow-500 text-black rounded px-4 py-2 text-sm font-medium hover:bg-yellow-400 disabled:opacity-50"
        >
          {saveState === 'saving' ? 'Saving…' : 'Save Lead'}
        </button>
      </div>
      {saveState === 'duplicate' && (
        <p className="text-sm text-yellow-400 mb-4">Lead already exists in your pipeline.</p>
      )}
      {saveState === 'saved' && (
        <p className="text-sm text-green-400 mb-4">Saved to My Leads.</p>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="border border-neutral-800 rounded-lg p-4">
            <h2 className="font-medium text-white mb-3">Trade Intelligence</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm text-neutral-300">
              <dt className="text-neutral-500">Product</dt>
              <dd>{supplier.product}</dd>
              <dt className="text-neutral-500">HS Code</dt>
              <dd>{supplier.hsCode}</dd>
              <dt className="text-neutral-500">Shipment Count</dt>
              <dd>{supplier.shipmentCount}</dd>
              <dt className="text-neutral-500">Total Trade Value</dt>
              <dd>${Number(supplier.totalShipmentValue).toLocaleString()}</dd>
              <dt className="text-neutral-500">Verified</dt>
              <dd>{supplier.verified ? 'Yes' : 'No'}</dd>
            </dl>
          </div>

          <div className="border border-neutral-800 rounded-lg p-4">
            <h2 className="font-medium text-white mb-3">
              Lead Score: {supplier.leadScore}/100 — {supplier.potential}
            </h2>
            <ul className="text-sm text-neutral-300 space-y-1">
              {(supplier.scoreReasons || []).map((reason, i) => (
                <li key={i}>✓ {reason}</li>
              ))}
            </ul>
          </div>

          <div className="border border-neutral-800 rounded-lg p-4">
            <h2 className="font-medium text-white mb-3">Shipment Evidence</h2>
            {shipments.length === 0 ? (
              <p className="text-sm text-neutral-500">No shipment evidence available.</p>
            ) : (
              <table className="w-full text-sm text-neutral-300">
                <thead className="text-neutral-500 text-left">
                  <tr>
                    <th className="pb-2">Product</th>
                    <th className="pb-2">HS Code</th>
                    <th className="pb-2">Origin</th>
                    <th className="pb-2">Destination</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr key={s.id} className="border-t border-neutral-900">
                      <td className="py-2">{s.product}</td>
                      <td className="py-2">{s.hsCode}</td>
                      <td className="py-2">{s.origin}</td>
                      <td className="py-2">{s.destination}</td>
                      <td className="py-2">{new Date(s.shipmentDate).toLocaleDateString()}</td>
                      <td className="py-2">${Number(s.value).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="border border-neutral-800 rounded-lg p-4 h-fit">
          <h2 className="font-medium text-white mb-3">Contact Details</h2>
          {supplier.contactUnlocked ? (
            <dl className="text-sm text-neutral-300 space-y-2">
              <div><dt className="text-neutral-500">Email</dt><dd>{supplier.email}</dd></div>
              <div><dt className="text-neutral-500">Phone</dt><dd>{supplier.phone}</dd></div>
              <div><dt className="text-neutral-500">Contact Person</dt><dd>{supplier.contactPerson}</dd></div>
              <div><dt className="text-neutral-500">Website</dt><dd>{supplier.website}</dd></div>
            </dl>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-neutral-500 mb-4">CONTACT DETAILS LOCKED</p>
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="bg-yellow-500 text-black rounded px-4 py-2 text-sm font-medium hover:bg-yellow-400 disabled:opacity-50"
              >
                {unlocking ? 'Unlocking…' : 'Unlock Contact'}
              </button>
            </div>
          )}
        </aside>
      </section>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
