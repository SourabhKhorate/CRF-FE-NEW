// src/pages/InvestorList.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Row,
  Col,
  Input,
  Select,
  Space,
  Spin,
  Alert,
  Empty,
  message,
  Button,
  Card,
  Typography,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { api } from "../api";

const { Text } = Typography;
const { Option } = Select;

const BACKEND = "https://api.925investor.com";
function normalizeUrl(rawPath) {
  return rawPath ? `${BACKEND}/${rawPath.replace(/\\/g, "/")}` : null;
}

export default function InvestorList() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ date: null });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get("/investor/getAll", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((res) => {
        if (cancelled) return;
        const raw = res.data["Investors: "] || [];
        setInvestors(Array.isArray(raw) ? raw : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Failed to load investors.");
        message.error("Could not fetch investors. Please try again.");
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
      // 1) search by name
      if (
        search &&
        !inv.name.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      // 2) date filter on created_at
      if (filters.date) {
        const created = new Date(inv.created_at);
        const diff = Date.now() - created;
        if (
          filters.date === "Last 30 Days" &&
          diff > 1000 * 60 * 60 * 24 * 30
        )
          return false;
        if (
          filters.date === "Last 6 Months" &&
          diff > 1000 * 60 * 60 * 24 * 30 * 6
        )
          return false;
        if (
          filters.date === "Last Year" &&
          diff > 1000 * 60 * 60 * 24 * 365
        )
          return false;
      }
      return true;
    });
  }, [investors, search, filters]);

  const docRender = (rawPath) => {
    const url = normalizeUrl(rawPath);
    if (!url) return <Text type="secondary">—</Text>;
    const ext = url.split(".").pop().toLowerCase();
    const viewableExts = ["pdf", "jpg", "jpeg", "png", "gif"];
    return (ext === "pdf" || viewableExts.includes(ext)) ? (
      <Button
        // icon={<EyeOutlined />}
        type="link"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        size="small"
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        View
      </Button>
    ) : (
      <Button
        icon={<DownloadOutlined />}
        type="link"
        href={url}
        download
        size="small"
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        Download
      </Button>
    );
  };

  const columns = [
    { title: "Id", key: "idx", width: 60, render: (_, __, i) => i + 1 },
    { title: "Type", dataIndex: "type", key: "type", },
    { title: "Name", dataIndex: "name", key: "name", },
    {
      title: "DOB",
      dataIndex: "dob",
      key: "dob",
      render: (d) => (d ? new Date(d).toLocaleDateString() : "—"),
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
      render: (m) => m || "—",
    },
    { title: "Email", dataIndex: "email", key: "email", },
    {
      title: "Aadhar Number",
      dataIndex: "aadharNumber",
      key: "aadharNumber",
      render: (v) => v || "—",
    },
    {
      title: "Aadhar Doc",
      dataIndex: "aadharDoc",
      key: "aadharDoc",
      render: docRender,
    },
    {
      title: "PAN Number",
      dataIndex: "panNumber",
      key: "panNumber",
      render: (v) => v || "—",
    },
    {
      title: "PAN Doc",
      dataIndex: "panDoc",
      key: "panDoc",
      render: docRender,
    },
    // {
    //   title: "Registered On",
    //   dataIndex: "created_at",
    //   key: "created_at",
    //   width: 140,
    //   render: (d) => (d ? new Date(d).toLocaleDateString() : "—"),
    // },
    { title: "Gender", dataIndex: "gender", key: "gender", },
  ];

  return (
    <Card bodyStyle={{ padding: 24 }}>
      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={12}>
          <Select
            size="large"
            placeholder="Registration Date"
            allowClear
            value={filters.date}
            onChange={(date) =>
              setFilters((f) => ({ ...f, date }))
            }
            style={{ width: "100%" }}
          >
            <Option value="Last 30 Days">Last 30 Days</Option>
            <Option value="Last 6 Months">Last 6 Months</Option>
            <Option value="Last Year">Last Year</Option>
          </Select>
        </Col>

        <Col xs={24} sm={12} md={12}>
          <Input
            size="small"
            // placeholder="Search by name"
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
      {loading ? (
        <Spin style={{ margin: 40, display: "block" }} />
      ) : error ? (
        <Alert type="error" message={error} style={{ margin: 24 }} />
      ) : filtered.length === 0 ? (
        <Empty description="No investors found" />
      ) : (
        <Table
          size="small"
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
          bordered
        />
      )}
    </Card>
  );
}
