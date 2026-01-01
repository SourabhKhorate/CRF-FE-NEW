// src/pages/InvestorProfile.js
import React, { useState, useEffect } from "react";
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
  Grid 
} from "antd";
import { EyeOutlined, DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";

const { Title, Text } = Typography;
const BACKEND = "https://api.925investor.com";
const { useBreakpoint } = Grid;

function normalizeUrl(rawPath) {
  return rawPath ? `${BACKEND}/${rawPath.replace(/\\/g, "/")}` : null;
}
function getExtension(url) {
  return url?.split(".").pop().toLowerCase();
}

export default function InvestorProfile() {
  const history = useHistory();
  const [investor, setInvestor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    const screens = useBreakpoint();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/investor/getInvestor", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((res) => {
        if (!cancelled) {
          setInvestor(res.data["Investor: "]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setError("Failed to load investor profile.");
          message.error("Could not fetch profile. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Spin tip="Loading profile..." style={{ margin: 40, display: "block" }} />
    );
  }
  if (error) {
    return <Alert type="error" message={error} style={{ margin: 40 }} />;
  }
  if (!investor) {
    return <Empty description="No profile data" style={{ margin: 40 }} />;
  }

  const docs = [
    { label: "Aadhaar Card", url: investor.aadharDoc },
    { label: "PAN Card", url: investor.panDoc },
  ];

  return (
    <div style={{ margin: "0 10px", padding: 24 }}>
      {/* <Row justify="space-between" align="middle">
        <Title level={3}>My Investor  Profile</Title>
        <Button
          type="primary"
          onClick={() => history.push("/editInvestorProfile")}
        >
          Edit Profile
        </Button>
      </Row> */}

       
    <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
      {/* Title */}
      <Col>
        <Title level={3}>My Investor Profile</Title>
      </Col>

      {/* Edit + Back */}
      <Col
        style={{
          display: "flex",
          alignItems: "center",
          // On mobile (<sm), spread buttons apart; on sm+ keep them together
          justifyContent: screens.sm ? "flex-start" : "space-between",
          width: screens.sm ? "auto" : "100%",
        }}
      >
        <Button
          type="primary"
          className="cta-btn"
          onClick={() => history.push("/editInvestorProfile")}
        >
          Edit Profile
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

      <Form layout="vertical" style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Full Name">
              <Input value={investor.name} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Email">
              <Input value={investor.email} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Mobile Number">
              <Input value={investor.mobile || "—"} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Date of Birth">
              <Input
                value={new Date(investor.dob).toLocaleDateString()}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Gender">
              <Input value={investor.gender} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Type">
              <Input value={investor.type} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Aadhaar Number">
              <Input value={investor.aadharNumber || "—"} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="PAN Number">
              <Input value={investor.panNumber || "—"} disabled />
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
          // treat PDFs and images as “view”able
          const viewableExts = ["pdf", "jpg", "jpeg", "png", "gif"];
          const isViewable = viewableExts.includes(ext);

          return (
            <Col xs={24} sm={12} md={12} key={label}>
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
                    isViewable ? (
                      <Button
                        icon={<EyeOutlined />}
                        type="link"
                        block
                        size="small"
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          paddingLeft: 0,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View Document
                      </Button>
                    ) : (
                      <Button
                        icon={<DownloadOutlined />}
                        type="link"
                        block
                        size="small"
                        href={fullUrl}
                        download
                        style={{
                          paddingLeft: 0,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
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
