// src/pages/FundPledgesList.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Table,
  Button,
  Spin,
  Alert,
  Empty,
  Grid,
} from "antd";
import { SearchOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory, useParams } from "react-router-dom";
import { api } from "../api";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function FundPledgesList() {
  const { fundId } = useParams();
  const history = useHistory();
  const screens = useBreakpoint();

  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get(`/pledges/getPledgesByFundId/${fundId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((res) => {
        if (cancelled) return;
        const list = res.data["Pledges: "] || [];
        setPledges(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (cancelled) return;
        // If 404, treat as empty list
        if (err.response?.status === 404) {
          setPledges([]);
        } else {
          console.error(err);
          setError("Failed to load pledges.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fundId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pledges;
    return pledges.filter((p) =>
      p.investor?.name.toLowerCase().includes(term)
    );
  }, [pledges, search]);

  const columns = [
    {
      title: "No.",
      key: "idx",
      width: 60,
      render: (_, __, i) => i + 1,
    },
    {
      title: "Investor",
      dataIndex: ["investor", "name"],
      key: "investorName",
      render: (val) => val && val.trim() !== "" ? val : <Text type="secondary">—</Text>,
    },
    {
      title: "Pledged Amount",
      dataIndex: "pledgedAmount",
      key: "pledgedAmount",
      render: (v) =>
        v && Number(v) > 0
          ? `₹${Number(v).toLocaleString()}`
          : <Text type="secondary">—</Text>,
    },
    {
      title: "No. of Investors",
      dataIndex: "numberOfInvestors",
      key: "numberOfInvestors",
      render: (v) =>
        v && Number(v) > 0
          ? v
          : <Text type="secondary">—</Text>,
    },
    {
      title: "Equity Expected",
      dataIndex: "equityExpected",
      key: "equityExpected",
      render: (v) =>
        v && Number(v) > 0
          ? `${v}%`
          : <Text type="secondary">—</Text>,
    },
    {
      title: "Start Date",
      dataIndex: "startingDate",
      key: "startingDate",
      render: (v) =>
        v && v.trim() !== ""
          ? v
          : <Text type="secondary">—</Text>,
    },
    {
      title: "Close Date",
      dataIndex: "closingDate",
      key: "closingDate",
      render: (v) =>
        v && v.trim() !== ""
          ? v
          : <Text type="secondary">—</Text>,
    },

    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          // type="primary"
          size="small"
          className="cta-btn"
          onClick={() => history.push(`/addInvestment/${record.id}`)}
          style={{
            padding: "0 12px",
            height: 35,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff" ,
            backgroundColor: "#fda400ff",
            // backgroundColor: "linear-gradient(90deg, #faad14 0%, #ed9f04 100%)",
            borderColor: "#fda400ff",
          }}
        >
          Shake Hand
        </Button>
      ),
    },

  ];


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
        <Title level={3}>Pledge List</Title>
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

      <Row justify="end" align="middle" style={{ marginBottom: 16 }}>

        {/* Search box on left */}
        <Col flex="auto" style={{ maxWidth: screens.sm ? 240 : "100%" }}>
          <Input
            size="small"
            // placeholder="Search by investor"
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
          <Empty description="No pledges found" />
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
