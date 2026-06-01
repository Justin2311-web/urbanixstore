"use client";

import { useEffect, useState } from "react";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
}

function getPresetRange(preset: string) {
  const now = new Date();

  if (preset === "today") return { from: isoDate(now), to: isoDate(now) };
  if (preset === "this-week") {
    const start = startOfWeek(now);
    return { from: isoDate(start), to: isoDate(addDays(start, 6)) };
  }
  if (preset === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: isoDate(start), to: isoDate(end) };
  }
  if (preset === "this-year") {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
  }

  return {
    from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export function FinancialReportFilterForm({
  categories,
  category,
  from,
  paymentMethod,
  paymentMethods,
  preset,
  source,
  sources,
  to,
}: {
  categories: string[];
  category: string;
  from: string;
  paymentMethod: string;
  paymentMethods: string[];
  preset: string;
  source: string;
  sources: string[];
  to: string;
}) {
  const [selectedPreset, setSelectedPreset] = useState(preset);
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);

  useEffect(() => {
    setSelectedPreset(preset);
    setFromDate(from);
    setToDate(to);
  }, [from, preset, to]);

  function handlePresetChange(nextPreset: string) {
    setSelectedPreset(nextPreset);

    if (nextPreset !== "custom") {
      const nextRange = getPresetRange(nextPreset);
      setFromDate(nextRange.from);
      setToDate(nextRange.to);
    }
  }

  return (
    <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-7">
      <select
        className="field-select"
        name="preset"
        onChange={(event) => handlePresetChange(event.target.value)}
        value={selectedPreset}
      >
        <option value="today">Today</option>
        <option value="this-week">This Week</option>
        <option value="this-month">This Month</option>
        <option value="last-month">Last Month</option>
        <option value="this-year">This Year</option>
        <option value="custom">Custom Range</option>
      </select>
      <input
        className="field-input"
        name="from"
        onChange={(event) => {
          setFromDate(event.target.value);
          setSelectedPreset("custom");
        }}
        type="date"
        value={fromDate}
      />
      <input
        className="field-input"
        name="to"
        onChange={(event) => {
          setToDate(event.target.value);
          setSelectedPreset("custom");
        }}
        type="date"
        value={toDate}
      />
      <select className="field-select" name="category" defaultValue={category}>
        <option value="all">All categories</option>
        {categories.map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className="field-select" name="source" defaultValue={source}>
        <option value="all">All sources</option>
        {sources.map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className="field-select" name="paymentMethod" defaultValue={paymentMethod}>
        <option value="all">All payment methods</option>
        {paymentMethods.map((item) => <option key={item}>{item}</option>)}
      </select>
      <button className="btn-primary justify-center" type="submit">Filter</button>
    </form>
  );
}
