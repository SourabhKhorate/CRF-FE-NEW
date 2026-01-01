// src/pages/ViewPledge.js
import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Row,
  Col,
  Input,       // ← we only need Input now
  Button,
  Typography,
  Spin,
  Alert,
} from "antd";
import { useHistory, useParams } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { api } from "../api";

const { Title } = Typography;

export default function ViewPledge() {
  const history = useHistory();
  const { pledgeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dto, setDto] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const token = sessionStorage.getItem("token");
        const resp = await api.get(
          `/pledges/getPledgeById/${pledgeId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancel) {
          setDto(resp.data["Pledges: "] || null);
        }
      } catch (e) {
        console.error(e);
        if (!cancel) setError("Failed to load pledge details");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [pledgeId]);

  if (loading) return <Spin style={{ margin: 40, display: "block" }} />;
  if (error)   return <Alert type="error" message={error} style={{ margin: 24 }} />;

  // helper to choose display value or placeholder
  const disp = (val, formatter = (x) => x) => {
    if (val === null || val === undefined) return "";
    // treat numeric zeros as empty
    if (!isNaN(val) && Number(val) === 0) return "";
    return formatter(val);
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={3}>View Pledge Details</Title>
        <Button
          onClick={() => history.goBack()}
          shape="circle"
          className="cta-btn"
          style={{
            width: 40, height: 40, padding: 0,
            // background: "#1890ff", 
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#fff" }} />}
        />
      </div>

      <Card>
        <Form layout="vertical">
          <Row gutter={16}>
            {/* Fund Name */}
            <Col xs={24} md={12}>
              <Form.Item label="Fund Name">
                <Input
                  disabled
                  value={disp(dto?.fundDetails?.proporalName)}
                  placeholder="—"
                />
              </Form.Item>
            </Col>

            {/* Pledged Amount */}
            <Col xs={24} md={12}>
              <Form.Item label="Pledged Amount">
                <Input
                  disabled
                  value={disp(dto?.pledgedAmount,
                    (v) => `₹${Number(v).toLocaleString()}`)}
                  placeholder="—"
                />
              </Form.Item>
            </Col>

            {/* Number of Investors */}
            <Col xs={24} md={12}>
              <Form.Item label="Number of Investors">
                <Input
                  disabled
                  value={disp(dto?.numberOfInvestors)}
                  placeholder="—"
                />
              </Form.Item>
            </Col>

            {/* Equity Expected */}
            <Col xs={24} md={12}>
              <Form.Item label="Equity Expected">
                <Input
                  disabled
                  value={disp(dto?.equityExpected, (v) => `${v}%`)}
                  placeholder="—"
                />
              </Form.Item>
            </Col>

            {/* Pledge Start Date */}
            <Col xs={24} md={12}>
              <Form.Item label="Pledge Start Date">
                <Input
                  disabled
                  value={disp(dto?.startingDate)}
                  placeholder="—"
                />
              </Form.Item>
            </Col>

            {/* Pledge Close Date */}
            <Col xs={24} md={12}>
              <Form.Item label="Pledge Close Date">
                <Input
                  disabled
                  value={disp(dto?.closingDate)}
                  placeholder="—"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}
