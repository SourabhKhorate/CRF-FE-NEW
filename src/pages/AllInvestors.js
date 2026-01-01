import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Input,
  Table,
  Spin,
  Alert,
  Empty,
  Select,
  message,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { api } from "../api";

const { Text } = Typography;
const { Option } = Select;

const BACKEND = "https://api.925investor.com";
function normalizeUrl(rawPath) {
  if (!rawPath) return null;
  return `${BACKEND}/${rawPath.replace(/\\/g, "/")}`;
}

export default function AllInvestors() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: null,
    date: null,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const token = sessionStorage.getItem("token");

    api
      .get("/investor/getAll", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (cancelled) return;
        const raw = res.data["Investors: "] || [];
        setInvestors(Array.isArray(raw) ? raw : []);
      })
      .catch((err) => {
        if (err.response && (err.response.status === 400 || err.response.status === 404)) {
          setInvestors([]);
        } else {
          setError("Failed to load investors.");
          message.error("Could not fetch investors. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return investors.filter((inv) => {
      // Search by name or email
      if (
        search &&
        !inv.name?.toLowerCase().includes(search.toLowerCase()) &&
        !inv.email?.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      // Filter by registration date
      if (filters.date) {
        const regDate = new Date(inv.registrationDate);
        const now = new Date();
        if (filters.date === "Last 30 Days") {
          if (regDate < new Date(now.setDate(now.getDate() - 30))) return false;
        } else if (filters.date === "Last 6 Months") {
          if (regDate < new Date(now.setMonth(now.getMonth() - 6))) return false;
        } else if (filters.date === "Last Year") {
          if (regDate < new Date(now.setFullYear(now.getFullYear() - 1))) return false;
        }
      }

      return true;
    });
  }, [investors, search, filters]);

  const docRender = (rawPath) => {
    const fullUrl = normalizeUrl(rawPath);
    if (!fullUrl) return <Text type="secondary">—</Text>;

    const ext = fullUrl.split(".").pop().toLowerCase();
    const viewableExts = ["pdf", "jpg", "jpeg", "png", "gif"];

    if (viewableExts.includes(ext)) {
      // PDFs and images open in new tab
      return (
        <Button
          // icon={<EyeOutlined />}
          type="link"
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          View
        </Button>
      );
    } else {
      // All other file types download
      return (
        <Button
          icon={<DownloadOutlined />}
          type="link"
          href={fullUrl}
          download
          size="small"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          Download
        </Button>
      );
    }
  };

  const formatValue = (value, type = "text") => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    if (type === "number") {
      return Number(value) || 0;
    }
    if (type === "boolean") {
      return value ? "Yes" : "No";
    }
    return value;
  };


  const columns = [
    {
      title: "Id",
      key: "id",
      render: (_, __, index) => index + 1,
    },
    { title: "Name", dataIndex: "name", key: "name", render: (v) => formatValue(v) },
    { title: "Type", dataIndex: "type", key: "type", render: (v) => formatValue(v) },
    { title: "DOB", dataIndex: "dob", key: "dob", render: (v) => formatValue(v) },
    { title: "Mobile", dataIndex: "mobile", key: "mobile", render: (v) => formatValue(v, "0") },
    { title: "Email", dataIndex: "email", key: "email", render: (v) => formatValue(v) },
    { title: "Aadhar Number", dataIndex: "aadharNumber", key: "aadharNumber", render: (v) => formatValue(v) },
    { title: "Aadhar Doc", dataIndex: "aadharDoc", key: "aadharDoc", render: (v) => v ? docRender(v) : "—" },
    { title: "PAN Number", dataIndex: "panNumber", key: "panNumber", render: (v) => formatValue(v) },
    { title: "PAN Doc", dataIndex: "panDoc", key: "panDoc", render: (v) => v ? docRender(v) : "—" },
    { title: "Gender", dataIndex: "gender", key: "gender", render: (v) => formatValue(v) },
  ];



  return (
    <div style={{ padding: 24 }}>
      {/* Search & Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* Registration Date filter */}
        <Col xs={24} sm={12} md={12}>
          <Select
            size="large"
            placeholder="Registration Date"
            allowClear
            value={filters.date}
            onChange={(val) => setFilters((f) => ({ ...f, date: val }))}
            style={{ width: "100%" }}
          >
            <Option value="Last 30 Days">Last 30 Days</Option>
            <Option value="Last 6 Months">Last 6 Months</Option>
            <Option value="Last Year">Last Year</Option>
          </Select>
        </Col>

        {/* Search */}
        <Col xs={24} sm={12} md={12}>
          <Input
            size="small"
            // placeholder="Search companies"
            placeholder="Search"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: "100%" }}
          />
        </Col>
      </Row>

      {/* Table */}
      <Card>
        {loading ? (
          <Spin style={{ display: "block", margin: "40px auto" }} />
        ) : error ? (
          <Alert type="error" message={error} style={{ margin: "40px auto", maxWidth: 400 }} />
        ) : filtered.length === 0 ? (
          <Empty description="No investors found" />
        ) : (
          <Table
            size="small"
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            bordered
            scroll={{ x: true }}
          />
        )}
      </Card>
    </div>
  );
}
