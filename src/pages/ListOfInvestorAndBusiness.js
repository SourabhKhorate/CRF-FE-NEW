import React, { useState, useEffect, useMemo } from "react";
import {
  Row,
  Col,
  Input,
  Select,
  Spin,
  Alert,
  Empty,
  message,
  Button,
  Card,
  Typography,
  List,
  Avatar,
} from "antd";
import {
  SearchOutlined,
  MessageOutlined,
  ArrowLeftOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { api } from "../api";
import { useHistory } from "react-router-dom";

const { Option } = Select;
const { Title, Text } = Typography;

function ListOfInvestorAndBusiness() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ date: null });

  const history = useHistory();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const token = sessionStorage.getItem("token");

    Promise.all([
      api.get("/investor/getAll", { headers: { Authorization: `Bearer ${token}` } }),
      api.get("/business/getAllCompanies", { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([investorRes, businessRes]) => {
        if (cancelled) return;

        const investors = (investorRes.data["Investors: "] || []).map((inv) => ({
          id: inv.id,
          type: "Investor",
          displayName: inv.name || "—",
          email: inv.email || "—",
          mobile: inv.mobile || "—",
          created_at: inv.created_at,
        }));

        const businesses = (businessRes.data["Listed Companies:"] || []).map((biz) => ({
          id: biz.id,
          type: "Business",
          displayName: biz.businessName || "—",
          email: biz.registrationEmail || "—",
          mobile: biz.contact || "—",
          created_at: biz.created_at,
        }));

        setData([...investors, ...businesses]);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Failed to load data.");
        message.error("Could not fetch data. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search && !item.displayName.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (filters.date) {
        const created = new Date(item.created_at);
        const diff = Date.now() - created;
        if (filters.date === "Last 30 Days" && diff > 1000 * 60 * 60 * 24 * 30) return false;
        if (filters.date === "Last 6 Months" && diff > 1000 * 60 * 60 * 24 * 30 * 6) return false;
        if (filters.date === "Last Year" && diff > 1000 * 60 * 60 * 24 * 365) return false;
      }
      return true;
    });
  }, [data, search, filters]);

  const investors = filteredData.filter((d) => d.type === "Investor");
  const businesses = filteredData.filter((d) => d.type === "Business");

  const handleChat = (record) => {
    const name = encodeURIComponent(record.displayName || "Unknown");
    const typeParam = record.type ? encodeURIComponent(record.type) : "";
    history.push(`/chatInterface?type=${typeParam}&id=${record.id}&name=${name}`);
  };

  // small utility to render initials if no avatar image
  const initials = (displayName) =>
    (!displayName || displayName === "—")
      ? "?"
      : displayName
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("");

  return (
    <Card bodyStyle={{ padding: 24 }}>
      {/* inline CSS for responsive wrapping + scrollable containers */}
      <style>{`
        /* container that holds list and allows vertical scroll */
        .list-scroll {
          max-height: 56vh; /* adjust as needed */
          overflow-y: auto;
          padding-right: 8px; /* give space for scrollbar */
        }

        /* each list item (row) */
        .list-item {
          padding: 12px;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 1px 0 rgba(0,0,0,0.02);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        /* left side: avatar + main text */
        .item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0; /* important so text can shrink/wrap */
          flex: 1 1 auto;
        }

        /* main text block that must be allowed to wrap */
        .item-main {
          min-width: 0; /* allow it to shrink inside flex container */
        }

        .item-main .name {
          font-weight: 600;
          margin-bottom: 4px;
          white-space: normal;
        }

        .item-main .meta {
          font-size: 12px;
          color: rgba(0,0,0,0.6);
          white-space: normal; /* allow wrap */
          overflow-wrap: anywhere; /* break long text (emails) */
          word-break: break-word;
        }

        /* right controls (chat button & date) should not shrink */
        .item-right {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* mobile tweaks: reduce container height and increase wrapping */
        @media (max-width: 576px) {
          .list-scroll {
            max-height: 40vh;
          }
          .list-item {
            padding: 10px;
          }
          .item-main .meta {
            font-size: 13px;
          }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={3}>Investor And Business List</Title>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
            }}
            icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#fff" }} />}
          />
        </div>
      </div>

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Select size="large" placeholder="Registration Date" allowClear value={filters.date}
            onChange={(date) => setFilters((f) => ({ ...f, date }))} style={{ width: "100%" }}>
            <Option value="Last 30 Days">Last 30 Days</Option>
            <Option value="Last 6 Months">Last 6 Months</Option>
            <Option value="Last Year">Last Year</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12}>
          <Input size="small" 
          // placeholder="Search by name" 
          placeholder="Search"
          prefix={<SearchOutlined />} value={search}
          onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: "100%" }} />
        </Col>
      </Row>

      {loading ? <Spin style={{ margin: 40, display: "block" }} /> :
        error ? <Alert type="error" message={error} style={{ margin: 24 }} /> :
          filteredData.length === 0 ? <Empty description="No data found" /> : (
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                {/* <Card size="small" title={`Investors (${investors.length})`} bordered={false}> */}
                <Card size="small" title={`Investors`} bordered={false}>
                  <div className="list-scroll">
                    <List
                      dataSource={investors}
                      locale={{ emptyText: <Empty description="No investors" /> }}
                      renderItem={(item, idx) => (
                        <div className="list-item" key={`investor-${item.id}-${idx}`}>
                          <div className="item-left">
                            <Avatar style={{ background: "#E6F7FF", verticalAlign: "middle", color: "#1890ff" }} size={48} icon={<UserOutlined />}>
                              {initials(item.displayName)}
                            </Avatar>

                            <div className="item-main">
                              <div className="name">{item.displayName}</div>
                              <div className="meta">{item.email}</div>
                              <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{item.mobile}</div>
                            </div>
                          </div>

                          <div className="item-right">
                            <Button type="link" icon={<MessageOutlined />} onClick={() => handleChat(item)}>Chat</Button>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                {/* <Card size="small" title={`Businesses (${businesses.length})`} bordered={false}> */}
                    <Card size="small" title={`Businesses`} bordered={false}>
                  <div className="list-scroll">
                    <List
                      dataSource={businesses}
                      locale={{ emptyText: <Empty description="No businesses" /> }}
                      renderItem={(item, idx) => (
                        <div className="list-item" key={`business-${item.id}-${idx}`}>
                          <div className="item-left">
                            <Avatar style={{ background: "#E6F7FF", verticalAlign: "middle", color: "#1890ff" }} size={48} icon={<UserOutlined />}>
                              {initials(item.displayName)}
                            </Avatar>

                            <div className="item-main">
                              <div className="name">{item.displayName}</div>
                              <div className="meta">{item.email}</div>
                              <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{item.mobile}</div>
                            </div>
                          </div>

                          <div className="item-right">
                            <Button type="link" icon={<MessageOutlined />} onClick={() => handleChat(item)}>Chat</Button>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          )}
    </Card>
  );
}

export default ListOfInvestorAndBusiness;
