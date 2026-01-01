// src/pages/OwnerProfile.js
import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  Form,
  Input,
  Typography,
  Row,
  Col,
  Button,
  Divider,
  Card,
  Spin,
  Alert,
  Empty,
  message,
} from "antd";
import { EyeOutlined, DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { api } from "../api";

const { Title, Text } = Typography;
const BACKEND = "https://api.925investor.com";

function normalizeUrl(rawPath) {
  return rawPath ? `${BACKEND}/${rawPath.replace(/\\/g, "/")}` : null;
}
function getExtension(url) {
  return url?.split(".").pop().toLowerCase();
}

export default function OwnerProfile() {
  const { ownerId } = useParams();
  const history = useHistory();
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get(`/owners/getOwnerByOwnerId/${ownerId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((res) => {
        if (cancelled) return;
        setOwner(res.data["Owner: "]);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Failed to load owner information.");
        message.error("Could not fetch owner. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  if (loading) {
    return <Spin tip="Loading owner..." style={{ margin: 40, display: "block" }} />;
  }
  if (error) {
    return <Alert type="error" message={error} style={{ margin: 40 }} />;
  }
  if (!owner) {
    return <Empty description="No owner data" style={{ margin: 40 }} />;
  }

  const docs = [
    { label: "PAN Document", url: owner.ownerPanDoc },
    { label: "Aadhaar Front", url: owner.ownerAadharDocFront },
    { label: "Aadhaar Back", url: owner.ownerAadharDocBack },
  ];

  return (
    <div style={{ margin: "0 10px", padding: 24 }}>
      {/* <Row justify="space-between" align="middle">
        <Title level={3}>Owner Details</Title>
        <Button onClick={() => history.goBack()}>Back</Button>
      </Row> */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={3}>Owner Details</Title>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
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
        </div>
      </div>

      <Form layout="vertical" >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Name">
              <Input value={owner.ownerName} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="PAN Number">
              <Input value={owner.ownerPanNumber || "—"} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="DIN Number">
              <Input value={owner.dinNumber || "—"} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Email">
              <Input value={owner.ownerEmail || "—"} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Contact">
              <Input value={owner.ownerContact || "—"} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Aadhaar Number">
              <Input value={owner.ownerAadharNumber || "—"} disabled />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Divider />

      <Title level={5}>Uploaded Documents</Title>
      <Row gutter={[16, 16]}>
        {docs.map(({ label, url }) => {
          const fullUrl = normalizeUrl(url);
          const ext = getExtension(fullUrl);
          const viewable = ["pdf", "jpg", "jpeg", "png", "gif"].includes(ext);

          return (
            <Col xs={24} sm={12} md={8} key={label}>
              <Card
                size="small"
                style={{
                  height: 100,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: 12,
                }}
              >
                <Text strong>{label}</Text>
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  {fullUrl ? (
                    viewable ? (
                      <Button
                        icon={<EyeOutlined />}
                        type="link"
                        block
                        size="small"
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </Button>
                    ) : (
                      <Button
                        icon={<DownloadOutlined />}
                        type="link"
                        block
                        size="small"
                        href={fullUrl}
                        download
                      >
                        Download
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
