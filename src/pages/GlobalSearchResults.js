// src/pages/GlobalSearchResults.js
import React, { useEffect, useState, useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Empty,
  Divider,
  Button,
  Table,
  Space,
  Tooltip,
} from "antd";
import { ArrowLeftOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { api } from "../api";

const { Title, Text } = Typography;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function humanize(s) {
  if (!s) return "";
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function dedupeByKey(arr = [], keyFn = (x) => x) {
  const seen = new Set();
  const out = [];
  for (const it of arr) {
    const k = keyFn(it);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

const formatCurrency = (v) => {
  if (v == null || v === "") return "-";
  const num = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.-]+/g, ""));
  if (isNaN(num)) return String(v);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
};

const formatDate = (d) => {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString();
  } catch {
    return String(d);
  }
};

/* Normalizers for each group shape (tailored to your service DTOs) */
function normalizeBusiness(b) {
  return {
    key: `business:${b.id}`,
    id: b.id,
    businessName: b.businessName,
    industrySector: b.industrySector,
    businessType: b.businessType,
    yearOfIncorporation: b.yearOfIncorporation,
    registrationEmail: b.registrationEmail,
    businessUrl: b.businessUrl,
    status: b.status,
    contact: b.contact,
    raw: b,
  };
}

function normalizeInvestor(inv) {
  return {
    key: `investor:${inv.id}`,
    id: inv.id,
    type: inv.type,
    name: inv.name,
    dob: inv.dob,
    mobile: inv.mobile,
    email: inv.email,
    gender: inv.gender,
    created_at: inv.created_at ?? inv.createdAt,
    raw: inv,
  };
}

function normalizeOwner(o) {
  return {
    key: `owner:${o.id}`,
    id: o.id,
    ownerName: o.ownerName,
    ownerPanNumber: o.ownerPanNumber,
    dinNumber: o.dinNumber,
    ownerEmail: o.ownerEmail,
    ownerContact: o.ownerContact,
    createdAt: o.createdAt,
    raw: o,
  };
}

function normalizePledge(p) {
  const fund = p.fundDetails || p.fund || null;
  const investor = p.investor || null;
  return {
    key: `pledge:${p.id}`,
    id: p.id,
    pledgedAmount: p.pledgedAmount,
    numberOfInvestors: p.numberOfInvestors ?? (fund?.numberOfInvestors ?? null),
    equityExpected: p.equityExpected ?? (fund?.equityOffered ?? ""),
    startingDate: p.startingDate ?? p.fundStartingDate ?? (fund?.fundStartingDate ?? null),
    closingDate: p.closingDate ?? p.fundClosingDate ?? (fund?.fundClosingDate ?? null),
    createdAt: p.createdAt,
    fund: fund
      ? {
          id: fund.id,
          proposalName: fund.proporalName || fund.proposalName || fund.proposal || fund.proposalName,
          targetedFund: fund.targetedFund ?? fund.targetedFund,
          raisedFund: fund.raisedFund,
          investmentType: fund.investmentType,
        }
      : null,
    investor: investor ? { id: investor.id, name: investor.name } : null,
    raw: p,
  };
}

/* NEW: normalize Investment (based on InvestmentResponseDTO) */
function normalizeInvestment(inv) {
  // inv: InvestmentResponseDTO
  const investor = inv.investor || inv.investorDto || null;
  const fund = inv.fundDetails || inv.fundDetailsDto || inv.fund || null;
  return {
    key: `investment:${inv.id}`,
    id: inv.id,
    investor: investor ? { id: investor.id, name: investor.name || investor.displayName || investor.username || "" } : null,
    fund: fund ? { id: fund.id, proposalName: fund.proposalName || fund.proporalName || fund.proposalName || "" } : null,
    status: inv.status,
    mileStoneReached: inv.mileStoneReached ?? inv.milestoneReached ?? "",
    numberOfInvestors: inv.numberOfInvestors ?? inv.numberOfInvestors,
    investedAmount: inv.investedAmount ?? inv.investedAmount,
    startingDate: inv.startingDate ?? inv.startingDate,
    closingDate: inv.closingDate ?? inv.closingDate,
    totalPeriod: inv.totalPeriod ?? inv.totalPeriod,
    createdAt: inv.createdAt ?? inv.createdAt,
    updatedAt: inv.updatedAt ?? inv.updatedAt,
    raw: inv,
  };
}

export default function GlobalSearchResults() {
  const history = useHistory();
  const query = useQuery();
  const q = (query.get("q") || "").trim();

  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]); // [{ title, items: [...] }]
  const [error, setError] = useState(null);

  const location = useLocation();

  useEffect(() => {
  // if query becomes empty, navigate back using state.from or fallback
  if (!q) {
    const from = (location && location.state && location.state.from) || document.referrer || null;
    if (from) {
      history.replace(from);
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      history.replace("/");
    }
  }
}, [q, history, location]);


  const authHeaders = () => {
    const t = sessionStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fetchResults = useCallback(async (term) => {
    if (!term) {
      setGroups([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/global/globalSearch", {
        params: { keyword: term },
        headers: authHeaders(),
      });

      const payload = res?.data ?? null;
      const data = payload?.data ?? null;

      const localGroups = [];

      if (data && typeof data === "object") {
        // Businesses
        if (Array.isArray(data.businesses) && data.businesses.length) {
          const items = data.businesses.map(normalizeBusiness).map((it) => ({
            ...it,
            key: `business:${it.id}`,
          }));
          localGroups.push({ title: "Businesses", key: "businesses", items: dedupeByKey(items, (x) => x.key) });
        }

        // Investors
        if (Array.isArray(data.investors) && data.investors.length) {
          const items = data.investors.map(normalizeInvestor).map((it) => ({ ...it, key: `investor:${it.id}` }));
          localGroups.push({ title: "Investors", key: "investors", items: dedupeByKey(items, (x) => x.key) });
        }

        // Pledges (funds)
        if (Array.isArray(data.pledges) && data.pledges.length) {
          const items = data.pledges.map(normalizePledge).map((it, idx) => ({ ...it, key: `pledge:${it.id ?? idx}` }));
          localGroups.push({ title: "Pledges", key: "pledges", items: dedupeByKey(items, (x) => x.key) });
        }

        // Owners
        if (Array.isArray(data.owner) && data.owner.length) {
          const items = data.owner.map(normalizeOwner).map((it) => ({ ...it, key: `owner:${it.id}` }));
          localGroups.push({ title: "Owners", key: "owner", items: dedupeByKey(items, (x) => x.key) });
        }

        // Investments (NEW)
        if (Array.isArray(data.investments) && data.investments.length) {
          const items = data.investments.map(normalizeInvestment).map((it) => ({ ...it, key: `investment:${it.id}` }));
          localGroups.push({ title: "Investments", key: "investments", items: dedupeByKey(items, (x) => x.key) });
        }

        // If none matched but there is some other array-like keys: include them generically
        if (localGroups.length === 0) {
          for (const key of Object.keys(data)) {
            const v = data[key];
            if (Array.isArray(v) && v.length) {
              const items = v.map((it, i) => ({
                key: `${key}:${it.id ?? i}`,
                id: it.id ?? i,
                title: it.name ?? it.title ?? it.businessName ?? `Item ${i + 1}`,
                subtitle: it.description ?? it.summary ?? "",
                raw: it,
              }));
              localGroups.push({ title: humanize(key), key, items });
            }
          }
        }
      } else {
        if (Array.isArray(payload)) {
          const items = payload.map((it, i) => ({ key: `r:${i}`, id: it.id ?? i, title: it.name ?? it.title ?? JSON.stringify(it), subtitle: "", raw: it }));
          localGroups.push({ title: "Results", key: "results", items });
        }
      }

      setGroups(localGroups);
      setError(null);
    } catch (err) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError("Authorization required — please sign in.");
      } else {
        setError("Failed to load results");
        console.error(err);
      }
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(q);
  }, [q, fetchResults]);

  /* Column definitions for each group */
  const businessColumns = [
    { title: "No.", dataIndex: "id", render: (_, __, idx) => idx + 1, width: 70 },
    { title: "Business", dataIndex: "businessName", key: "businessName", render: (t) => <Text strong>{t}</Text> },
    { title: "Industry", dataIndex: "industrySector", key: "industrySector" },
    { title: "Year", dataIndex: "yearOfIncorporation", key: "yearOfIncorporation", width: 120 },
    { title: "Email", dataIndex: "registrationEmail", key: "registrationEmail" },
    { title: "URL", dataIndex: "businessUrl", key: "businessUrl", render: (u) => u || "-" },
    { title: "Status", dataIndex: "status", key: "status", width: 120 },
    { title: "Contact", dataIndex: "contact", key: "contact", width: 140 },
  ];

  const investorColumns = [
    { title: "No.", dataIndex: "id", render: (_, __, idx) => idx + 1, width: 70 },
    { title: "Name", dataIndex: "name", key: "name", render: (t) => <Text strong>{t}</Text> },
    { title: "Type", dataIndex: "type", key: "type", width: 120 },
    { title: "DOB", dataIndex: "dob", key: "dob", render: (d) => formatDate(d), width: 120 },
    { title: "Mobile", dataIndex: "mobile", key: "mobile", width: 140 },
    { title: "Email", dataIndex: "email", key: "email" },
  ];

  const ownerColumns = [
    { title: "No.", dataIndex: "id", render: (_, __, idx) => idx + 1, width: 70 },
    { title: "Owner", dataIndex: "ownerName", key: "ownerName", render: (t) => <Text strong>{t}</Text> },
    { title: "PAN", dataIndex: "ownerPanNumber", key: "ownerPanNumber", width: 160 },
    { title: "DIN", dataIndex: "dinNumber", key: "dinNumber", width: 140 },
    { title: "Email", dataIndex: "ownerEmail", key: "ownerEmail" },
    { title: "Contact", dataIndex: "ownerContact", key: "ownerContact", width: 140 },
    // { title: "Created", dataIndex: "createdAt", key: "createdAt", render: (d) => formatDate(d), width: 140 },
  ];

  const pledgeColumns = [
    { title: "No.", dataIndex: "id", render: (_, __, idx) => idx + 1, width: 70 },
    {
      title: "Fund",
      dataIndex: "fund",
      key: "fund",
      render: (fund) => fund?.proposalName || fund?.proporalName || (fund?.id ? `Fund ${fund.id}` : "-"),
    },
    {
      title: "Pledged Amount",
      dataIndex: "pledgedAmount",
      key: "pledgedAmount",
      render: (v) => formatCurrency(v),
    },
    {
      title: "No. of Investors",
      dataIndex: "numberOfInvestors",
      key: "numberOfInvestors",
      width: 140,
    },
    {
      title: "Equity Expected",
      dataIndex: "equityExpected",
      key: "equityExpected",
      width: 140,
    },
    {
      title: "Start Date",
      dataIndex: "startingDate",
      key: "startingDate",
      width: 140,
      render: (d) => formatDate(d),
    },
    {
      title: "Close Date",
      dataIndex: "closingDate",
      key: "closingDate",
      width: 140,
      render: (d) => formatDate(d),
    },
  ];

  /* NEW: investments columns based on InvestmentResponseDTO */
  const investmentColumns = [
    { title: "No.", dataIndex: "id", render: (_, __, idx) => idx + 1, width: 70 },
    {
      title: "Investor",
      dataIndex: "investor",
      key: "investor",
      render: (inv) => inv?.name || "-",
    },
    {
      title: "Fund",
      dataIndex: "fund",
      key: "fund",
      render: (fund) => fund?.proposalName || fund?.proporalName || "-",
    },
    { title: "Status", dataIndex: "status", key: "status", width: 120 },
    { title: "Milestone", dataIndex: "mileStoneReached", key: "mileStoneReached", width: 160 },
    { title: "No. of Investors", dataIndex: "numberOfInvestors", key: "numberOfInvestors", width: 140 },
    { title: "Invested Amount", dataIndex: "investedAmount", key: "investedAmount", render: (v) => formatCurrency(v) },
    { title: "Start Date", dataIndex: "startingDate", key: "startingDate", render: (d) => formatDate(d), width: 120 },
    { title: "Close Date", dataIndex: "closingDate", key: "closingDate", render: (d) => formatDate(d), width: 120 },
    // { title: "Created", dataIndex: "createdAt", key: "createdAt", render: (d) => formatDate(d), width: 140 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          {/* <Title level={3} style={{ margin: 0 }}>Search results</Title> */}
          <Text type="secondary">Showing results for: <strong>{q || "-"}</strong></Text>
        </Col>
        <Col>
          <Button
            onClick={() => history.goBack()}
            shape="circle"
            className="cta-btn"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              // background: "#1890ff",
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
            icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#fff" }} />}
          />
        </Col>
      </Row>

      <Card style={{ minHeight: 200, borderRadius: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 36 }}>
            <Spin />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 36 }}>
            <Text type="danger">{error}</Text>
          </div>
        ) : (!groups || groups.length === 0) ? (
          <Empty description={q ? "No results found" : "Type a query to search"} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {groups.map((g) => (
              <div key={g.key}>
                <Divider orientation="left" style={{ marginBottom: 12 }}>{g.title} ({g.items.length})</Divider>

                {/* Choose table columns by group key */}
                {g.key === "businesses" && (
                  <Table
                    dataSource={g.items}
                    columns={businessColumns}
                    pagination={{ pageSize: 6 }}
                    rowKey="key"
                    bordered
                    size="middle"
                    scroll={{ x: true }}
                  />
                )}

                {g.key === "investors" && (
                  <Table
                    dataSource={g.items}
                    columns={investorColumns}
                    pagination={{ pageSize: 6 }}
                    rowKey="key"
                    bordered
                    size="middle"
                    scroll={{ x: true }}
                  />
                )}

                {g.key === "pledges" && (
                  <Table
                    dataSource={g.items}
                    columns={pledgeColumns}
                    pagination={{ pageSize: 5 }}
                    rowKey="key"
                    bordered
                    size="middle"
                    scroll={{ x: true }}
                  />
                )}

                {g.key === "owner" && (
                  <Table
                    dataSource={g.items}
                    columns={ownerColumns}
                    pagination={{ pageSize: 6 }}
                    rowKey="key"
                    bordered
                    size="middle"
                    scroll={{ x: true }}
                  />
                )}

                {g.key === "investments" && (
                  <Table
                    dataSource={g.items}
                    columns={investmentColumns}
                    pagination={{ pageSize: 6 }}
                    rowKey="key"
                    bordered
                    size="middle"
                    scroll={{ x: true }}
                  />
                )}

                {/* Generic fallback table for unexpected groups */}
                {["businesses", "investors", "pledges", "owner", "investments"].indexOf(g.key) === -1 && (
                  <Table
                    dataSource={g.items}
                    columns={[
                      { title: "No.", render: (_, __, idx) => idx + 1, width: 80 },
                      { title: "Title", dataIndex: "title", key: "title", render: (t) => <Text strong>{t}</Text> },
                      { title: "Subtitle", dataIndex: "subtitle", key: "subtitle" },
                    ]}
                    pagination={{ pageSize: 6 }}
                    rowKey="key"
                    bordered
                    size="middle"
                    scroll={{ x: true }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
