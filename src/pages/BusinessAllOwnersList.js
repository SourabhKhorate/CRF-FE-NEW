// src/pages/BusinessAllOwnersList.js
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Table,
  Button,
  Space,
  Spin,
  Alert,
  Empty,
  message,
  Grid,
} from "antd";
import { SearchOutlined, EyeOutlined, DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { api } from "../api";

const { Title, Text } = Typography;
const BACKEND = "https://api.925investor.com";

const { useBreakpoint } = Grid;

function normalizeUrl(rawPath) {
  return rawPath ? `${BACKEND}/${rawPath.replace(/\\/g, "/")}` : null;
}

export default function BusinessAllOwnersList() {
  const { businessId } = useParams();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const history = useHistory();
  const screens = useBreakpoint();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get(`/owners/getByBusinessId/${businessId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((res) => {
        if (cancelled) return;
        const list = res.data["Owners: "] || [];
        setOwners(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (cancelled) return;

        // If 404, treat as “no owners” rather than a real error
        if (err.response?.status === 404) {
          setOwners([]);
        } else {
          console.error(err);
          setError("Failed to load owners.");
          message.error("Could not fetch owners. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const filtered = useMemo(() => {
    return owners.filter((o) =>
      o.ownerName.toLowerCase().includes(search.toLowerCase())
    );
  }, [owners, search]);

  const renderDoc = (path) => {
    const url = normalizeUrl(path);
    if (!url) return <Text type="secondary">—</Text>;

    const ext = url.split(".").pop().toLowerCase();
    const viewableExts = ["pdf", "jpg", "jpeg", "png", "gif"];
    if (ext === "pdf" || viewableExts.includes(ext)) {
      return (
        <Button
          // icon={<EyeOutlined />}
          type="link"
          size="small"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          View
        </Button>
      );
    } else {
      return (
        <Button
          icon={<DownloadOutlined />}
          type="link"
          size="small"
          href={url}
          download
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          Download
        </Button>
      );
    }
  };

  const columns = [
    // {
    //   title: "ID",
    //   dataIndex: "id",
    //   key: "id",
    //   render: (value) => value ?? "—",
    // },
      { title: "ID.", key: "idx", width: 60, render: (_, __, i) => i + 1, },
    { title: "Name", dataIndex: "ownerName", key: "ownerName", },
    { title: "PAN Number", dataIndex: "ownerPanNumber", key: "ownerPanNumber", },
    {
      title: "PAN Doc",
      dataIndex: "ownerPanDoc",
      key: "ownerPanDoc",
      render: renderDoc,
    },
    { title: "DIN Number", dataIndex: "dinNumber", key: "dinNumber", },
    { title: "Email", dataIndex: "ownerEmail", key: "ownerEmail", },
    { title: "Contact", dataIndex: "ownerContact", key: "ownerContact", },
    {
      title: "Aadhaar Number",
      dataIndex: "ownerAadharNumber",
      key: "ownerAadharNumber",
      render: (v) => v || "—",
    },
    {
      title: "Aadhar Front",
      dataIndex: "ownerAadharDocFront",
      key: "ownerAadharDocFront",
      render: renderDoc,
    },
    {
      title: "Aadhar Back",
      dataIndex: "ownerAadharDocBack",
      key: "ownerAadharDocBack",
      render: renderDoc,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => history.push(`/owners/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];


  return (
    <div style={{ padding: 24 }}>
      {/* <Row justify="end" style={{ marginBottom: 16 }}>
        <Col>
          <Input
            size="small"
            placeholder="Search"
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
        </Col>
        <Col>
          <Button
            type="primary"
            // icon={<PlusOutlined />}
            onClick={() => history.push("/businessAddOwnerInformation")}
          >
            Add Owner
          </Button>
        </Col>
      </Row> */}

      <Row justify="end" gutter={[12, 0]} align="middle" style={{ marginBottom: 16 }}>
        {/* Search by name */}
        <Col flex="auto" style={{ maxWidth: screens.sm ? 240 : "100%" }}>
          <Input
            size="small"
            // placeholder="Search by fund"
            placeholder="Search"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: "100%" }}
          />
        </Col>

        {/* Back button: responsive column so it won't overflow on small screens */}
        <Col
          // keep button fixed width, don't allow it to grow
          style={{
            flex: '0 0 auto',
            // on small screens place below input with gap; on larger screens keep inline with a left gap
            marginLeft: screens.sm ? 12 : 0,
            marginTop: screens.sm ? 0 : 0,
          }}
        >
          <Button
            onClick={() => history.goBack()}
            className="cta-btn"
            shape="circle"
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


      <Card>
        {loading ? (
          <Spin style={{ display: "block", margin: "40px auto" }} />
        ) : error ? (
          <Alert type="error" message={error} style={{ margin: "40px auto", maxWidth: 400 }} />
        ) : filtered.length === 0 ? (
          <Empty description="No owners found" />
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
