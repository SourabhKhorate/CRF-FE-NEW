// src/pages/MyInvestment.js
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
  Button,
  Select,
} from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import ReactApexChart from "react-apexcharts";
import { api } from "../api";

const { Title, Text } = Typography;
const { Option } = Select;

const columns = [
  { title: "Id", key: "index", render: (_, __, index) => index + 1 },
  { title: "FUND NAME", dataIndex: "fundName", key: "fundName", render: val => val || <Text type="secondary">—</Text> },
  { title: "STARTED DATE", dataIndex: "startingDate", key: "startingDate", render: val => val || "—" },
  { title: "CLOSED DATE", dataIndex: "closingDate", key: "closingDate", render: val => val || "—" },
  { title: "DURATION", dataIndex: "totalPeriod", key: "totalPeriod", render: val => val != null ? `${val} days` : "—" },
  { title: "MILESTONE REACHED", dataIndex: "milestoneReached", key: "milestoneReached", render: val => val || "0%" },
  { title: "INVESTED AMOUNT", dataIndex: "investedAmount", key: "investedAmount", render: val => val != null ? `$${Number(val).toLocaleString()}` : "$0" },
  { title: "NUMBER OF INVESTORS", dataIndex: "numberOfInvestors", key: "numberOfInvestors", render: val => val != null ? val : "0" },
];

export default function MyInvestment() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ date: null, company: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await api.get("/investments/getInvestmentsByInvestor", {
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
          numberOfInvestors: inv.numberOfInvestors,
          startingDate: inv.startingDate,
          closingDate: inv.closingDate,
          totalPeriod: inv.totalPeriod,
          milestoneReached: inv.mileStoneReached ? `${inv.mileStoneReached}` : "0",
          investedAmount: inv.investedAmount,
          sector: inv.fundDetails?.sector,
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

  const filtered = useMemo(() => {
    return rows.filter((inv) => {
      const name = inv.fundName?.toLowerCase() || "";
      const investor = inv.investorName?.toLowerCase() || "";
      const searchTerm = search.toLowerCase();

      if (search && !name.includes(searchTerm) && !investor.includes(searchTerm)) {
        return false;
      }

      if (filters.date) {
        const created = new Date(inv.created_at);
        const diff = Date.now() - created;
        if (filters.date === "Last 30 Days" && diff > 1000 * 60 * 60 * 24 * 30)
          return false;
        if (filters.date === "Last 6 Months" && diff > 1000 * 60 * 60 * 24 * 30 * 6)
          return false;
        if (filters.date === "Last Year" && diff > 1000 * 60 * 60 * 24 * 365)
          return false;
      }

      if (filters.company) {
        if (inv.id !== filters.company) return false;
      }

      return true;
    });
  }, [rows, search, filters]);

  const kpis = useMemo(() => {
    const totalInvested = filtered.reduce((sum, r) => sum + (r.investedAmount || 0), 0);
    const distinctFunds = new Set(filtered.map(r => r.id)).size;
    const avgInvestment = filtered.length ? totalInvested / filtered.length : 0;
    const avgMilestone = filtered.length
      ? filtered.reduce((sum, r) => sum + (parseFloat(r.milestoneReached) || 0), 0) / filtered.length
      : 0;
    return {
      totalInvested,
      totalCompanies: distinctFunds,
      avgInvestment,
      totalEquityPct: avgMilestone,
    };
  }, [filtered]);

  const dataByFund = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = r.id;
      const name = r.fundName || "Unknown";
      const existing = map.get(key);
      if (existing) {
        existing.amt += r.investedAmount || 0;
      } else {
        map.set(key, { name, amt: r.investedAmount || 0 });
      }
    });
    return Array.from(map.values());
  }, [filtered]);

  const barChart = {
    series: [{ name: "Investment", data: dataByFund.map((d) => d.amt) }],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      xaxis: { categories: dataByFund.map((d) => d.name) },
      dataLabels: { enabled: false },
      plotOptions: {
        bar: { borderRadius: 4, columnWidth: "50%" },
      },
    },
  };

  if (loading) return <Spin tip="Loading..." style={{ margin: 40, display: "block" }} />;
  if (error) return <Alert type="error" message={error} style={{ margin: 24 }} />;

  const uniqueCompanies = Array.from(
    new Map(rows.map(r => [r.id, r.fundName])).entries()
  );

  return (
    <div style={{ padding: 24 }}>

      <Row justify="space-between" align="middle">
        <Title level={3}>My Investment</Title>
        {/* <Button icon={<DownloadOutlined />}>Download Report</Button> */}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Total Invested" value={kpis.totalInvested} prefix="$" /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Fund Invested In" value={kpis.totalCompanies} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Avg. Investment" value={Math.round(kpis.avgInvestment)} prefix="$" /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Avg. Milestone %" value={Math.round(kpis.totalEquityPct)} suffix="%" /></Card></Col>
      </Row>

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 12 }}>
        <Col xs={24} sm={12} md={6}>
          <Select
            size="large"
            placeholder="Filter by Date"
            allowClear
            style={{ width: "100%" }}
            onChange={(val) => setFilters(f => ({ ...f, date: val }))}
          >
            <Option value="Last 30 Days">Last 30 Days</Option>
            <Option value="Last 6 Months">Last 6 Months</Option>
            <Option value="Last Year">Last Year</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            size="large"
            placeholder="Filter by Fund"
            allowClear
            style={{ width: "100%" }}
            onChange={(val) => setFilters(f => ({ ...f, company: val }))}
          >
            {uniqueCompanies.map(([id, name]) => (
              <Option key={id} value={id}>{name}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Input
            size="small"
            placeholder="Search"
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ width: "100%" }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col span={24}><Card title="Investment per Fund"><ReactApexChart options={barChart.options} series={barChart.series} type="bar" height={300} /></Card></Col>
      </Row>

      {/* <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 12 }}>
        <Col>
          <Select placeholder="Filter by Date" allowClear style={{ width: 150 }} onChange={(val) => setFilters(f => ({ ...f, date: val }))}>
            <Option value="Last 30 Days">Last 30 Days</Option>
            <Option value="Last 6 Months">Last 6 Months</Option>
            <Option value="Last Year">Last Year</Option>
          </Select>
        </Col>
        <Col>
          <Select placeholder="Filter by Fund" allowClear style={{ width: 200 }} onChange={(val) => setFilters(f => ({ ...f, company: val }))}>
            {uniqueCompanies.map(([id, name]) => (
              <Option key={id} value={id}>{name}</Option>
            ))}
          </Select>
        </Col>
        <Col flex="auto" style={{ textAlign: 'right' }}>
          <Input size="small" placeholder="Search" prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ width: 200 }} />
        </Col>
      </Row> */}

      <Card>
        {filtered.length === 0
          ? <Empty description="No Business Investment found"/>
          : <Table size="small" columns={columns} dataSource={filtered} rowKey="key" pagination={{ pageSize: 10 }} bordered scroll={{ x: true }} />}
      </Card>
    </div>
  );
}
