// src/pages/Fundraising.js
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Progress,
  Button,
  Switch,
  Spin,
  Alert,
  Empty,
} from "antd";
import { useHistory } from "react-router-dom";
import { api } from "../api";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Fundraising() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClosed, setShowClosed] = useState(false);
  const history = useHistory();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const token = sessionStorage.getItem("token");
        const statusParam = showClosed ? "In-active" : "active";

        const res = await api.get(
          "/fundDetails/getFundDetailsByBusinessId",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { status: statusParam },
          }
        );

        const raw = res.data["Funds: "] || [];
        const list = Array.isArray(raw) ? raw : [];

        if (!cancelled) {
          setFunds(list);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setFunds([]);
          setError(null);
        } else {
          console.error(err);
          setError("Unable to load fund details. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showClosed]);  // ← re-run when the toggle flips

  // 1. Loading
  if (loading) {
    return <Spin tip="Loading funds..." style={{ margin: 40, display: "block" }} />;
  }

  // 2. True error
  if (error) {
    return <Alert type="error" message={error} style={{ margin: 24 }} />;
  }


  // 4. Render cards
  return (
    <div className="fundraising-container" style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        {/* <Title level={3}>Current Fund Raising</Title> */}
        <Title level={3}>
          {showClosed
            ? "In‑Active Fund Raising"
            : "Current Active Fund Raising"}
        </Title>
        <Button type="primary" className="cta-btn" onClick={() => history.push("/createFund")}>
          Raise Fund
        </Button>
      </div>

      <div
        className="fundraising-toggle"
        style={{ marginBottom: 16, textAlign: "center" }}
      >
        <Text>Active Campaigns</Text>
        <Switch
          checked={showClosed}
          onChange={setShowClosed}
          checkedChildren=""
          unCheckedChildren=""
          style={{ margin: "0 8px" }}
        />
        <Text>Closed Campaigns</Text>
      </div>
      {funds.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 64 }}>
          <Empty description="No Current fund to display" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {funds.map((c) => {
            const percent =
              c.targetedFund > 0 && c.raisedFund != null
                ? Math.min(100, Math.round((c.raisedFund / c.targetedFund) * 100))
                : 0;

            return (
              <Col key={c.id} xs={24} sm={12} md={12} lg={8} xl={6}>
              
                {(() => {
                  const titleText = c.proposalName ?? c.proporalName ?? "-";
                  const titleStyle = {
                    color: "#110379",
                    fontWeight: 600,
                    fontFamily: "'Segoe UI', sans-serif",
                    fontSize: 18,
                    lineHeight: "1.4",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 1, // clamp to 2 lines
                    WebkitBoxOrient: "vertical",
                    whiteSpace: "normal",
                  };

                  const projectRowStyle = {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 2,
                  };

                  // const projectLabelStyle = {
                  //   minWidth: 80,
                  //   flex: "0 0 80px",
                  // };

                  const projectValueStyle = {
                    flex: 1,
                    display: "block", // allow maxWidth to apply
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  };

                  return (
                    <Card
                      title={
                        <div style={titleStyle} title={titleText}>
                          {titleText}
                        </div>
                      }
                      bordered
                      style={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 8,
                      }}
                      headStyle={{ borderBottom: "1px solid #f0f0f0" }}
                      bodyStyle={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        padding: 16,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={projectRowStyle}>
                          <Text strong>
                            Project:
                          </Text>

                          <span style={projectValueStyle} title={titleText}>
                            {titleText}
                          </span>
                        </div>

                        <div style={{ marginTop: 16 }}>
                          <Text strong>Required Amount / Goal</Text>
                          <div>₹{(c.targetedFund ?? 0).toLocaleString()}</div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                          <Text strong>Current Fund Raising Status</Text>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: 4,
                            }}
                          >
                            <Text style={{ marginRight: 8 }}>
                              {percent >= 100 ? "Completed" : "In Progress"} {percent}%
                            </Text>
                          </div>
                          <Progress percent={percent} showInfo={false} />
                        </div>

                        <div style={{ marginTop: 16, marginBottom: 16 }}>
                          <Text strong>Number of Investors</Text>
                          <div>{c.numberOfInvestors ?? "-"}</div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 12,
                          marginTop: "auto",
                        }}
                      >
                        {/* Edit (only when active) */}
                        {c.status?.toLowerCase() === "active" && (
                          <Button
                            type="primary"
                            shape="square"
                            className="cta-btn"
                            style={{
                              width: 35,
                              height: 35,
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            icon={
                              <EditOutlined
                                style={{
                                  color: "#fff",
                                  marginLeft: 5,
                                }}
                              />
                            }
                            onClick={() => history.push(`/editFund/${c.id}`)}
                          />
                        )}

                        {/* View Fund Details */}
                        <Button
                          type="primary"
                          className="cta-btn"
                          shape="square"
                          style={{
                            width: 35,
                            height: 35,
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          icon={<EyeOutlined style={{ color: "#fff", marginLeft: 5 }} />}
                          onClick={() => history.push(`/fundraising/${c.id}`)}
                        />

                        {/* View Pledges Button */}
                        <Button
                          type="primary"
                          className="cta-btn"
                          style={{
                            padding: "0 12px",
                            height: 35,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onClick={() => history.push(`/fundPledges/${c.id}`)}
                        >
                          View Pledges
                        </Button>
                      </div>
                    </Card>
                  );
                })()}
              </Col>

            );
          })}
        </Row>
      )}
    </div>
  );
}
