"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      message: formData.get("message"),
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSent(true);
      }
    } catch (err) {
      console.error("Failed to submit contact form", err);
    }
  }

  if (sent) {
    return (
      <div className="doc-card max-w-xl">
        <h3 className="font-display text-xl text-[var(--ink)]">Inquiry received</h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
          Thanks — a trade specialist will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="doc-card grid max-w-xl gap-4">
      <div>
        <label htmlFor="name" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-2)]">Your Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Jordan Rao"
          className="w-full rounded-sm border border-[var(--ink)]/20 bg-white px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink)]/40 focus:border-[var(--brass)] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-2)]">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="w-full rounded-sm border border-[var(--ink)]/20 bg-white px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink)]/40 focus:border-[var(--brass)] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="company" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-2)]">Company Name</label>
        <input
          id="company"
          name="company"
          type="text"
          placeholder="Company Pvt. Ltd."
          className="w-full rounded-sm border border-[var(--ink)]/20 bg-white px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink)]/40 focus:border-[var(--brass)] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-2)]">Requirement</label>
        <textarea
          id="message"
          name="message"
          required
          placeholder="Tell us about your business requirement"
          className="min-h-[140px] w-full rounded-sm border border-[var(--ink)]/20 bg-white px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink)]/40 focus:border-[var(--brass)] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="mt-2 rounded-sm bg-[var(--brass)] px-7 py-3 font-mono text-xs uppercase tracking-[0.15em] text-[var(--ink)] transition hover:brightness-110"
      >
        Submit Inquiry
      </button>
    </form>
  );
}
