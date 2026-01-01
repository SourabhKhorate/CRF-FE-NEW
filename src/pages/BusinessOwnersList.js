// src/pages/BusinessOwnersList.js
import React, { useState, useEffect, useMemo } from "react";
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
import { SearchOutlined, EyeOutlined, DownloadOutlined, EditOutlined,ArrowLeftOutlined  } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";

const { Title, Text } = Typography;
const BACKEND = "https://api.925investor.com";

const { useBreakpoint } = Grid;

function normalizeUrl(rawPath) {
  return rawPath ? `${BACKEND}/${rawPath.replace(/\\/g, "/")}` : null;
}

export default function BusinessOwnersList() {
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
      .get("/owners/getOwnersOfLoggedInBusiness", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((res) => {
        if (cancelled) return;
        const list = res.data["Owners: "] || [];
        setOwners(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Failed to load owners.");
        message.error("Could not fetch owners. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
    { title: "No.", key: "idx", width: 60, render: (_, __, i) => i + 1, },
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
      align: "center",
      width: 100,
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginLeft: 0,
            paddingLeft: 0,
          }}
        >
          <Button
            type="link"
            icon={<EditOutlined />}
            title="Edit"
            style={{
              minWidth: 28,
              marginLeft: 0,
              paddingLeft: 0,
            }}
            onClick={() =>
              history.push(`/businessEditOwnerInformation/${record.id}`)
            }
          />
          <Button
            type="link"
            icon={<EyeOutlined />}
            title="View"
            style={{
              minWidth: 28,
              marginLeft: 0,
              paddingLeft: 0,
            }}
            onClick={() => history.push(`/owners/${record.id}`)}
          />
        </div>
      ),
    }




  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
      {/* Search box */}
      <Col style={{ width: screens.sm ? 240 : "100%" }}>
        <Input
          size="small"
          // placeholder="Search by name"
          placeholder="Search"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: "100%" }}   // will fill its Col
        />
      </Col>

      {/* Add Owner + Back */}
      <Col
        style={{
          display: "flex",
          alignItems: "center",
          // on desktop keep them together; on mobile spread them apart
          justifyContent: screens.sm ? "flex-start" : "space-between",
          width: screens.sm ? "auto" : "100%",
          marginTop: screens.sm ? 0 : 16,
        }}
      >
        <Button
          type="primary"
          className="cta-btn"
          onClick={() => history.push("/businessAddOwnerInformation")}
        >
          Add Owner
        </Button>

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
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            marginLeft: screens.sm ? 16 : 0,
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
            scroll={{ x: "max-content" }}
          />
        )}
      </Card>
    </div>
  );
}
