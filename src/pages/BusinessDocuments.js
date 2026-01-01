// src/pages/BusinessDocuments.js
import React, { useState, useEffect } from "react";
import { Row, Col, Typography, Card, Spin, Alert, Empty, Button, message,Grid } from "antd";
import { EyeOutlined, DownloadOutlined, ArrowLeftOutlined  } from "@ant-design/icons";
import { api } from "../api";
import { useHistory } from "react-router-dom";

const { Title, Text } = Typography;
const BACKEND = "https://api.925investor.com";
const { useBreakpoint } = Grid;

function normalizeUrl(rawPath) {
  if (!rawPath) return null;
  const normalized = rawPath.replace(/\\/g, "/");
  return `${BACKEND}/${normalized}`;
}

export default function BusinessDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const history = useHistory();
  const screens = useBreakpoint();

  useEffect(() => {
    let cancelled = false;
    api
      .get("/business/getMyBusiness", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((res) => {
        if (cancelled) return;
        const biz = res.data["Business:"] || {};
        setDocs([
          { key: "incCert", label: "Incorporation Certificate", url: biz.incorporationCertificate },
          { key: "panDoc", label: "Company PAN Document", url: biz.companyPanDoc },
          { key: "udyam", label: "Udyam Aadhaar Document", url: biz.udyamAdharDoc },
          { key: "moa", label: "MOA Document", url: biz.moaDoc },
          { key: "aoa", label: "AOA Document", url: biz.aoaDoc },
          { key: "gst", label: "GST Certificate", url: biz.gstDoc },
        ]);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Failed to load business documents.");
        message.error("Could not fetch documents. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <Spin tip="Loading documents..." style={{ margin: 40, display: "block" }} />;
  }
  if (error) {
    return <Alert type="error" message={error} style={{ margin: 40 }} />;
  }
  if (!docs.length) {
    return <Empty description="No documents available" style={{ margin: 40 }} />;
  }

  return (
    <div style={{ padding: 24, margin: "0 auto" }}>


       <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
      {/* Title */}
      <Col>
        <Title level={4}>Business Documents</Title>
      </Col>

      {/* Edit + Back */}
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
          onClick={() => history.push("/editBusinessDocuments")}
        >
          Edit Documents
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

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {docs.map(({ key, label, url: rawPath }) => {
          const fullUrl = normalizeUrl(rawPath);
          const ext = fullUrl?.split(".").pop().toLowerCase();
          const viewableExts = ["pdf", "jpg", "jpeg", "png", "gif"];

          return (
            <Col xs={24} sm={12} md={8} key={key}>
              <Card
                size="small"
                bodyStyle={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 120,
                  padding: 24,
                }}
                style={{
                  borderRadius: 12,
                  border: "1px solid #f0f0f0",
                  boxShadow: "none",
                }}
              >
                <Text strong>{label}</Text>

                <div style={{ textAlign: "center", marginTop: 16 }}>
                  {fullUrl ? (
                    viewableExts.includes(ext) ? (
                      <Button
                        icon={<EyeOutlined />}
                        type="link"
                        size="small"
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Document
                      </Button>
                    ) : (
                      <Button
                        icon={<DownloadOutlined />}
                        type="link"
                        size="small"
                        href={fullUrl}
                        download
                      >
                        Download Document
                      </Button>
                    )
                  ) : (
                    <Text type="secondary">No document uploaded</Text>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

    </div>
  );
}
