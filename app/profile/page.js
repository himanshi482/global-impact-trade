"use client";

import { useState, useEffect } from "react";
import AuthGuard from "../../components/AuthGuard";
import FieldLabel from "../../components/FieldLabel";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [quota, setQuota] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    companyName: "",
    country: "",
    city: "",
    website: "",
  });

  useEffect(() => {
    fetch("/api/unlock", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setQuota(data.quota))
      .catch((err) => console.error("Failed to load unlock quota", err));
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setFormData({
            name: data.user.name || "",
            phone: data.user.phone || "",
            companyName: data.user.companyName || "",
            country: data.user.country || "",
            city: data.user.city || "",
            website: data.user.website || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Unable to load profile data");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Profile updated successfully!");
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Update profile error", err);
      setError("Network error while saving profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[var(--ink)] py-12 px-6">
        <div className="mx-auto max-w-4xl">
          <FieldLabel>Account Credentials &amp; Settings</FieldLabel>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--paper)] mb-2">
            User Account Profile
          </h1>
          <p className="text-xs text-[var(--muted)] mb-8">
            Manage your company details, license subscription level, and contact information.
          </p>

          {loading ? (
            <div className="flex justify-center py-20 font-mono text-xs text-[var(--brass)]">
              <span className="h-4 w-4 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin mr-2"></span>
              Loading profile details...
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-12">
              {/* Profile Summary Card */}
              <div className="md:col-span-4 rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 font-mono text-xs h-fit space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brass)] text-[var(--ink)] font-bold text-lg">
                    {profile?.name ? profile.name[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--paper)]">{profile?.name}</h3>
                    <span className="text-[10px] text-[var(--brass)] uppercase font-semibold">
                      {profile?.role} Account
                    </span>
                  </div>
                </div>

                <div className="border-t border-[var(--brass)]/15 pt-4 space-y-2 text-[11px]">
                  <div>
                    <span className="text-[var(--muted)] block">Email Address:</span>
                    <span className="text-[var(--paper)]">{profile?.email}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted)] block">Current Plan:</span>
                    <span className="inline-block rounded bg-[var(--brass)]/20 px-2 py-0.5 text-[var(--brass)] font-bold uppercase mt-0.5">
                      {profile?.plan || "FREE EXPLORER"}
                    </span>
                  </div>
                  {quota && (
                    <div>
                      <span className="text-[var(--muted)] block">Contact Unlocks:</span>
                      {quota.isUnlimited ? (
                        <span className="text-emerald-400 font-semibold">Unlimited</span>
                      ) : (
                        <span className={quota.remaining === 0 ? "text-red-400 font-semibold" : "text-[var(--paper)]"}>
                          {quota.used} / {quota.maxAllowed} used
                          {quota.remaining === 0 && " — upgrade to unlock more"}
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--muted)] block">Account Status:</span>
                    <span className="text-emerald-400 font-semibold">Active &amp; Verified</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted)] block">Member Since:</span>
                    <span className="text-[var(--paper)]">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="md:col-span-8 rounded-xl border border-[var(--brass)]/30 bg-[var(--ink-2)] p-6 md:p-8 font-mono text-xs shadow-xl">
                {message && (
                  <div className="mb-6 rounded-lg bg-emerald-950/80 border border-emerald-500/50 p-4 text-emerald-300">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="mb-6 rounded-lg bg-red-950/80 border border-red-500/50 p-4 text-red-300">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-display text-xl text-[var(--paper)]">Update Information</h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[var(--muted)] uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--muted)] uppercase mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[var(--brass)]/15 pt-5 space-y-4">
                    <h4 className="text-[var(--brass)] uppercase font-bold text-[11px] tracking-wider">
                      Business Details
                    </h4>

                    <div>
                      <label className="block text-[var(--muted)] uppercase mb-1">Company Name</label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Exim Global Traders Pvt Ltd"
                        className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[var(--muted)] uppercase mb-1">Country</label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="India"
                          className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] uppercase mb-1">City</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Mumbai"
                          className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[var(--muted)] uppercase mb-1">Company Website</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://company.com"
                        className="w-full rounded border border-[var(--brass)]/30 bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] focus:outline-none focus:border-[var(--brass)]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded bg-[var(--brass)] py-3 font-mono text-xs uppercase tracking-wider text-[var(--ink)] font-bold hover:brightness-110 disabled:opacity-50 transition"
                  >
                    {saving ? "Saving Changes..." : "Save Profile Details"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
