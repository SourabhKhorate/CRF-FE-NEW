// src/pages/VerifiedCompanies.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Input,
  Select,
  Table,
  Space,
  Spin,
  Alert,
  Empty,
  message,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";
import { useLocation } from "react-router-dom";

const { Text } = Typography;
const { Option } = Select;

const BACKEND = "https://api.925investor.com";
function normalizeUrl(rawPath) {
  if (!rawPath) return null;
  return `${BACKEND}/${rawPath.replace(/\\/g, "/")}`;
}

export default function VerifiedCompanies() {
  const history = useHistory();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ date: null });
  const location = useLocation();

  useEffect(() => {
    if (location.state?.successMessage) {
      message.success(location.state.successMessage);
    }
  }, [location.state]);



  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const token = sessionStorage.getItem("token");

    api
      .get("/business/getVerifiedCompanies", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: "Verified" },
      })
      .then((res) => {
        if (cancelled) return;
        const raw = res.data["Companies:"] || [];
        setCompanies(Array.isArray(raw) ? raw : []);
      })
      .catch((err) => {
        if (err.response && (err.response.status === 400 || err.response.status === 404)) {
          setCompanies([]); // No companies
        } else {
          setError("Failed to load listed companies.");
          message.error("Could not fetch companies. Please try again.");
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
    return companies.filter((c) => {
      if (
        search &&
        !c.businessName.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (filters.date) {
        const created = new Date(c.createdAt);
        const diff = Date.now() - created;
        if (filters.date === "Last 30 Days" && diff > 1000 * 60 * 60 * 24 * 30)
          return false;
        if (
          filters.date === "Last 6 Months" &&
          diff > 1000 * 60 * 60 * 24 * 30 * 6
        )
          return false;
        if (filters.date === "Last Year" && diff > 1000 * 60 * 60 * 24 * 365)
          return false;
      }
      return true;
    });
  }, [companies, search, filters]);

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


  const columns = [
    {
      title: "Id",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Business Name",
      dataIndex: "businessName",
      key: "businessName",
      render: (v) => v || "—",
    },
    {
      title: "Industry Sector",
      dataIndex: "industrySector",
      key: "industrySector",
      render: (v) => v || "—",
    },
    {
      title: "Business Type",
      dataIndex: "businessType",
      key: "businessType",
      render: (v) => v || "—",
    },
    {
      title: "Year Of Incorporation",
      dataIndex: "yearOfIncorporation",
      key: "yearOfIncorporation",
      render: (v) => v || "—",
    },
    {
      title: "Registration Email",
      dataIndex: "registrationEmail",
      key: "registrationEmail",
      render: (v) => v || "—",
    },
    {
      title: "Email Verified",
      dataIndex: "emailVerified",
      key: "emailVerified",
      render: (v) => (v ? "Yes" : "No"),
    },
    {
      title: "Business Url",
      dataIndex: "businessUrl",
      key: "businessUrl",
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noopener noreferrer">
            {v}
          </a>
        ) : (
          "—"
        ),
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      render: (v) => v || "—",
    },
    {
      title: "Contact Verified",
      dataIndex: "contactVerified",
      key: "contactVerified",
      render: (v) => (v ? "Yes" : "No"),
    },
    {
      title: "Incorporation Certificate",
      dataIndex: "incorporationCertificate",
      key: "incorporationCertificate",
      render: docRender,
    },
    {
      title: "Company Pan Number",
      dataIndex: "companyPanNumber",
      key: "companyPanNumber",
      render: (v) => v || "—",
    },
    {
      title: "Company Pan Doc",
      dataIndex: "companyPanDoc",
      key: "companyPanDoc",
      render: docRender,
    },
    {
      title: "Udyam Adhar Number",
      dataIndex: "udyamAdharNumber",
      key: "udyamAdharNumber",
      render: (v) => v || "—",
    },
    {
      title: "Udyam Adhar Doc",
      dataIndex: "udyamAdharDoc",
      key: "udyamAdharDoc",
      render: docRender,
    },
    {
      title: "Moa Doc",
      dataIndex: "moaDoc",
      key: "moaDoc",
      render: docRender,
    },
    {
      title: "Aoa Doc",
      dataIndex: "aoaDoc",
      key: "aoaDoc",
      render: docRender,
    },
    {
      title: "Gst Certificate Number",
      dataIndex: "gstCertificateNumber",
      key: "gstCertificateNumber",
      render: (v) => v || "—",
    },
    {
      title: "Gst Doc",
      dataIndex: "gstDoc",
      key: "gstDoc",
      render: docRender,
    },
    {
      title: "Owners List",
      key: "owners",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            // pass businessId if needed
            history.push(`/businessAllOwnersList/${record.id}`);
          }}
        >
          View Owners
        </Button>
      ),
    },
    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   key: "status",
    //   width: 120,
    // },
    // {
    //   title: "Action",
    //   key: "actions",
    //   width: 120,
    //   render: (_, record) => (
    //     <Button
    //       type="link"
    //       onClick={() => history.push(`/company/${record.id}`)}
    //     >
    //       View
    //     </Button>
    //   ),
    // },
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


      <Card>
        {loading ? (
          <Spin style={{ display: "block", margin: "40px auto" }} />
        ) : error ? (
          <Alert
            type="error"
            message={error}
            style={{ margin: "40px auto", maxWidth: 400 }}
          />
        ) : filtered.length === 0 ? (
          <Empty description="No companies found" />
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
