// src/pages/LegalDocuments.js
import React, { useState } from "react";
import {
  Row,
  Col,
  Checkbox,
  Typography,
  Button,
  Space,
  Divider,
  Grid,
} from "antd";
import { UploadOutlined, EyeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// in future you can replace this with data fetched from your backend
const requiredDocs = [
  {
    key: "agreement",
    title: "Investor Agreement",
    status: "Uploaded",
    description:
      "This agreement outlines the terms and conditions of your investment.",
    actionType: "view",
  },
  {
    key: "risk",
    title: "Risk Disclosure",
    status: "Uploaded",
    description:
      "This document details the risks associated with investing in startups.",
    actionType: "view",
  },
  {
    key: "kyc",
    title: "KYC Form",
    status: "Pending",
    description:
      "This form is required to verify your identity and comply with regulations.",
    actionType: "upload",
  },
  {
    key: "terms",
    title: "Terms & Conditions",
    status: "Required",
    description:
      "Please review our terms and conditions before proceeding.",
    actionType: "view",
  },
];

export default function LegalDocuments() {
  const [checkedKeys, setCheckedKeys] = useState([]);
  const screens = useBreakpoint();
  const history = useHistory();

  const onCheckboxChange = (key, checked) => {
    setCheckedKeys((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key)
    );
  };

  return (
    <div style={{ padding: 24, margin: "0 auto" }}>
      {/* <Title level={3}>Legal Documents</Title> */}
      <Row justify="space-between" align="middle">
        <Title level={3}>Legal Documents</Title>
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
      </Row>
      <Paragraph>
        Before you can proceed with your investment, we need to ensure that all
        necessary legal documents are in place. Please review and manage the
        documents listed below.
      </Paragraph>

      <Divider />

      <Title level={5}>Required Documents</Title>

      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {requiredDocs.map((doc) => (
          <Row key={doc.key} gutter={[16, 16]} align="middle">
            {/* Left side: checkbox + details */}
            <Col xs={24} md={18}>
              <Space align="start">
                <Checkbox
                  checked={checkedKeys.includes(doc.key)}
                  onChange={(e) =>
                    onCheckboxChange(doc.key, e.target.checked)
                  }
                />
                <div>
                  <Text strong>{doc.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {doc.status}
                  </Text>
                  <Paragraph
                    type="secondary"
                    style={{ margin: 0, fontSize: 12 }}
                  >
                    {doc.description}
                  </Paragraph>
                </div>
              </Space>
            </Col>

            {/* Right side: render action button inline */}
            <Col
              xs={24}
              md={6}
              style={{ textAlign: screens.md ? "right" : "center" }}
            >
              {doc.actionType === "view" ? (
                <Button
                  icon={<EyeOutlined />}
                  size="middle"
                  style={{ width: 140 }}
                >
                  View
                </Button>
              ) : (
                <Button
                  icon={<UploadOutlined />}
                  type="primary"
                  className="cta-btn"
                  size="middle"
                  style={{ width: 140 }}
                >
                  Upload
                </Button>
              )}
            </Col>
          </Row>
        ))}
      </Space>

      <Divider />

      {/* Footer button centered on mobile, right-aligned on desktop */}
      <Row justify={screens.md ? "end" : "center"}>
        <Col>
          <Button type="primary" className="cta-btn">Acknowledge & Continue</Button>
        </Col>
      </Row>
    </div>
  );
}
