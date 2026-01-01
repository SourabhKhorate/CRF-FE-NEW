// src/pages/ViewPreviousVenture.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import {
  Row,
  Col,
  Card,
  Typography,
  Descriptions,
  Spin,
  Alert,
  Progress,
} from "antd";

const { Title, Text } = Typography;

export default function ViewPreviousVenture() {
  const { id } = useParams();
  const [venture, setVenture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await api.get(`/investments/getById/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const inv = res.data.venture ?? null;
        if (!cancelled) setVenture(inv);
      } catch {
        if (!cancelled) setError("Unable to load details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return <Spin tip="Loading details..." style={{ margin: 40, display: "block" }} />;
  }
  if (error) {
    return <Alert type="error" message={error} />;
  }
  if (!venture) {
    return <Alert type="warning" message="No data found." />;
  }

  // Destructure with fallbacks
  const {
    fundDetails = {},
    investor = {},
    numberOfInvestors,
    investedAmount,
    milestoneReached,
    startingDate,
    closingDate,
    totalPeriod,
  } = venture;

  const fundName = fundDetails.proposalName || "—";
  const fundStatus = fundDetails.status || "N/A";
  const investorName = investor.name || "—";
  const investorsCount = numberOfInvestors != null ? numberOfInvestors : 0;
  const investedFmt = investedAmount != null
    ? `$${Number(investedAmount).toLocaleString()}`
    : "$0";
  const milestonePct = milestoneReached != null
    ? parseFloat(milestoneReached.toString().replace("%","")) 
    : 0;
  const milestoneText = milestoneReached || "0%";
  const periodText = totalPeriod != null 
    ? `${totalPeriod} days` 
    : "—";
  const startText = startingDate || "—";
  const closeText = closingDate || "—";

  return (
    <div style={{ padding: 24 }}>
      {/* Page Title & Subtitle */}
      <Title level={2} style={{ marginBottom: 0 }}>{fundName}</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        Investor: {investorName}
      </Text>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Text strong style={{ fontSize: 24 }}>{investorsCount}</Text>
            <br />
            <Text># Investors</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Text strong style={{ fontSize: 24 }}>{investedFmt}</Text>
            <br />
            <Text>Invested</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Progress
              type="circle"
              percent={milestonePct}
              width={80}
              strokeWidth={8}
            />
            <br />
            <Text>Milestone</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Text strong style={{ fontSize: 24 }}>{periodText}</Text>
            <br />
            <Text>Duration</Text>
          </Card>
        </Col>
      </Row>

      {/* Details Section */}
      <Card>
        <Descriptions
          bordered
          column={1}
          size="middle"
          labelStyle={{ width: "30%", fontWeight: 500 }}
          contentStyle={{ width: "70%" }}
        >
          <Descriptions.Item label="Fund">{fundName}</Descriptions.Item>
          <Descriptions.Item label="Investor">{investorName}</Descriptions.Item>
          <Descriptions.Item label="Status">{fundStatus}</Descriptions.Item>
          <Descriptions.Item label="Start Date">{startText}</Descriptions.Item>
          <Descriptions.Item label="Close Date">{closeText}</Descriptions.Item>
          <Descriptions.Item label="# Investors">{investorsCount}</Descriptions.Item>
          <Descriptions.Item label="Invested Amount">{investedFmt}</Descriptions.Item>
          <Descriptions.Item label="Duration">{periodText}</Descriptions.Item>
          <Descriptions.Item label="Milestone Reached">{milestoneText}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
