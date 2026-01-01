// src/pages/MyPledgesList.js
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
import { SearchOutlined, ArrowLeftOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";

const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function MyPledgesList() {
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
      .get("/pledges/getPledgesOfLoggedInvestorId", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((res) => {
        if (cancelled) return;
        const list = res.data["Pledges: "] || [];
        setPledges(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (cancelled) return;
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
  }, []);

  // filter by fund name
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pledges;
    return pledges.filter((p) =>
      p.fundDetails?.proporalName.toLowerCase().includes(term)
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
    title: "Fund",
    dataIndex: ["fundDetails", "proporalName"],
    key: "fundName",
    render: (val) =>
      val && val.trim() !== "" ? val : <Text type="secondary">—</Text>,
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
  align: "center",
  width: 100,
  render: (_, record) => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // <-- vertical centering
        height: "100%",        // <-- makes sure it fills the cell
        gap: 8,
      }}
    >
      <Button
        type="link"
        icon={<EditOutlined />}
        title="Edit Pledge"
        onClick={() => history.push(`/editPledge/${record.id}`)}
        style={{ padding: 0 }} // optional: tighten padding
      />
      <Button
        type="link"
        icon={<EyeOutlined />}
        title="View Pledge"
        onClick={() => history.push(`/viewPledge/${record.id}`)}
        style={{ padding: 0 }} // optional: tighten padding
      />
    </div>
  ),
}

];


  return (
    <div style={{ padding: 24 }}>
      <Row justify="end" align="middle" style={{ marginBottom: 16 }}>
        
        {/* Search by fund */}
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
