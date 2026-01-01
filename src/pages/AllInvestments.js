// src/pages/AllInvestments.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Empty,
  Spin,
  Alert,
  Typography,
  Row,
  Col,
  Input,
  Statistic,
  Select,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ReactApexChart from "react-apexcharts";
import { api } from "../api";

const { Title, Text } = Typography;
const { Option } = Select;

const columns = [
  { title: "Id", key: "index", render: (_, __, idx) => idx + 1 },
  {
    title: "FUND NAME",
    dataIndex: "fundName",
    key: "fundName",
    render: (val) => val || <Text type="secondary">—</Text>,
  },
  {
    title: "INVESTOR NAME",
    dataIndex: "investorName",
    key: "investorName",
    render: (val) => (val ? <Text>{val}</Text> : <Text type="secondary">—</Text>),
  },
  {
    title: "STARTED DATE",
    dataIndex: "startingDate",
    key: "startingDate",
    render: (val) => val || "—",
  },
  {
    title: "CLOSED DATE",
    dataIndex: "closingDate",
    key: "closingDate",
    render: (val) => val || "—",
  },
  {
    title: "DURATION",
    dataIndex: "totalPeriod",
    key: "totalPeriod",
    render: (val) => (val != null ? `${val} days` : "—"),
  },
  {
    title: "MILESTONE REACHED",
    dataIndex: "milestoneReached",
    key: "milestoneReached",
    render: (val) => val || "0%",
  },
  {
    title: "INVESTED AMOUNT",
    dataIndex: "investedAmount",
    key: "investedAmount",
    render: (val) => (val != null ? `₹${Number(val).toLocaleString()}` : "₹0"),
  },
  {
    title: "NUMBER OF INVESTORS",
    dataIndex: "numberOfInvestors",
    key: "numberOfInvestors",
    render: (val) => (val != null ? val : "0"),
  },
];

export default function AllInvestments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ date: null, fund: null });

  // fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await api.get("/investments/getAll", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const invs = Array.isArray(res.data["Investments: "])
          ? res.data["Investments: "]
          : [];
        const mapped = invs.map((inv) => ({
          key: inv.id,
          id: inv.id,
          fundName: inv.fundDetails?.proposalName?.trim(),
          investorName: inv.investor?.name?.trim(),
          startingDate: inv.startingDate,
          closingDate: inv.closingDate,
          totalPeriod: inv.totalPeriod,
          milestoneReached: inv.mileStoneReached
            ? `${inv.mileStoneReached}%`
            : "0%",
          investedAmount: inv.investedAmount,
          numberOfInvestors: inv.numberOfInvestors,
          created_at: inv.createdAt,
        }));
        if (!cancelled) setRows(mapped);
      } catch (e) {
        if (!cancelled) {
          if (e.response?.status === 404) setRows([]);
          else setError("Failed to load data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // apply search + filters
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const name = (r.fundName || "").toLowerCase();
      const inv = (r.investorName || "").toLowerCase();
      const term = search.trim().toLowerCase();
      if (term && !name.includes(term) && !inv.includes(term)) return false;

      if (filters.date) {
        const diff = Date.now() - new Date(r.created_at);
        if (
          (filters.date === "30d" && diff > 1000 * 60 * 60 * 24 * 30) ||
          (filters.date === "6m" && diff > 1000 * 60 * 60 * 24 * 30 * 6) ||
          (filters.date === "1y" && diff > 1000 * 60 * 60 * 24 * 365)
        ) return false;
      }

      if (filters.fund && r.id !== filters.fund) return false;
      return true;
    });
  }, [rows, search, filters]);

  // KPI cards
  const kpis = useMemo(() => {
    const totalInvested = filtered.reduce((s, r) => s + (r.investedAmount || 0), 0);
    const numFunds = new Set(filtered.map((r) => r.id)).size;
    return { totalInvested, numFunds };
  }, [filtered]);

  // chart: count of investments over time (by created date)
  const seriesData = useMemo(() => {
    const byDay = new Map();
    filtered.forEach((r) => {
      const day = r.created_at.slice(0, 10); // yyyy-mm-dd
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });
    // sort days
    const sorted = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
    return {
      categories: sorted.map(([d]) => d),
      counts: sorted.map(([, c]) => c),
    };
  }, [filtered]);

  // dropdown fund list
  const fundOptions = useMemo(() => {
    return Array.from(
      new Map(rows.map((r) => [r.id, r.fundName])).entries()
    );
  }, [rows]);

  if (loading) return <Spin tip="Loading..." style={{ margin: 40, display: "block" }} />;
  if (error) return <Alert type="error" message={error} style={{ margin: 24 }} />;

  const lineChart = {
    series: [{ name: "Investments", data: seriesData.counts }],
    options: {
      chart: { toolbar: { show: false } },
      xaxis: { categories: seriesData.categories, type: "datetime" },
      yaxis: { min: 0, },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth" },
      title: { text: "Active Investments Over Time", align: "left" },
    },
  };

  return (
    <div style={{ padding: 24 }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={12}>
          <Card>
            <Statistic title="Total Investment" value={kpis.totalInvested} prefix="INR" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Card>
            <Statistic title="Number of Funds" value={kpis.numFunds} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Select
            size="large"
            placeholder="Last 30 Days / 6m / 1y"
            style={{ width: "100%" }}
            allowClear
            onChange={(v) => setFilters((f) => ({ ...f, date: v }))}
          >
            <Option value="30d">Last 30 Days</Option>
            <Option value="6m">Last 6 Months</Option>
            <Option value="1y">Last Year</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            size="large"
            placeholder="Filter by Fund"
            style={{ width: "100%" }}
            allowClear
            onChange={(v) => setFilters((f) => ({ ...f, fund: v }))}
          >
            {fundOptions.map(([id, name]) => (
              <Option key={id} value={id}>
                {name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Input
            size="small"
            // placeholder="Search by fund or investor"
            placeholder="Search"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: "100%" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Col>
      </Row>

      {/* Area Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card>
            <ReactApexChart
              options={lineChart.options}
              series={lineChart.series}
              type="area"
              height={350}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {filtered.length === 0
          ? <Empty description="No Investment found" />
          : <Table size="small" columns={columns} dataSource={filtered} rowKey="key"
            pagination={{ pageSize: 10 }} bordered scroll={{ x: true }} />}
      </Card>
    </div>
  );

}
