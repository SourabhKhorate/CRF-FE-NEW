// // src/pages/PreviousVentures.js
// import React, { useState, useEffect, useMemo } from "react";
// import {
//   Card,
//   Table,
//   Empty,
//   Spin,
//   Alert,
//   Typography,
//   Row,
//   Col,
//   Input,
// } from "antd";
// import { api } from "../api";
// import { SearchOutlined } from "@ant-design/icons";

// const { Text } = Typography;

// const columns = [
//   {
//     title: "Id",
//     key: "index",
//     render: (_, __, index) => index + 1,

//   },
//   {
//     title: "FUND NAME",
//     dataIndex: "fundName",
//     key: "fundName",
//     render: (val) => val || <Text type="secondary">—</Text>,

//   },
//   {
//     title: "INVESTOR NAME",
//     dataIndex: "investorName",
//     key: "investorName",
//     render: (val) => (val ? <Text>{val}</Text> : <Text type="secondary">—</Text>),

//   },
//   {
//     title: "STARTED DATE",
//     dataIndex: "startingDate",
//     key: "startingDate",
//     render: (val) => val || "—",

//   },
//   {
//     title: "CLOSED DATE",
//     dataIndex: "closingDate",
//     key: "closingDate",
//     render: (val) => val || "—",

//   },
//   {
//     title: "DURATION",
//     dataIndex: "totalPeriod",
//     key: "totalPeriod",
//     render: (val) => (val != null ? `${val} days` : "—"),

//   },
//   {
//     title: "MILESTONE REACHED",
//     dataIndex: "milestoneReached",
//     key: "milestoneReached",
//     render: (val) => val || "0%",

//   },
//   {
//     title: "INVESTED AMOUNT",
//     dataIndex: "investedAmount",
//     key: "investedAmount",
//     render: (val) =>
//       val != null ? `$${Number(val).toLocaleString()}` : "$0",

//   },
//   {
//     title: "NUMBER OF INVESTORS",
//     dataIndex: "numberOfInvestors",
//     key: "numberOfInvestors",
//     render: (val) => (val != null ? val : "0"),

//   },
// ];

// export default function PreviousVentures() {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [search, setSearch] = useState("");

//   const filtered = useMemo(() => {
//     const term = search.trim().toLowerCase();
//     if (!term) return rows;
//     return rows.filter(r =>
//       (r.investorName || "").toLowerCase().includes(term) ||
//       (r.fundName || "").toLowerCase().includes(term)
//     );
//   }, [rows, search]);

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       try {
//         const token = sessionStorage.getItem("token");
//         const res = await api.get("/investments/getPreviousVentures", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         // normalize to array even if key is missing or null
//         const rawInvs = res.data["Previous Ventures: "];
//         const invs = Array.isArray(rawInvs) ? rawInvs : [];

//         const mapped = invs.map((inv) => ({
//           key: inv.id,
//           fundName: inv.fundDetails?.proposalName,
//           investorName: inv.investor?.name,
//           numberOfInvestors: inv.numberOfInvestors,
//           startingDate: inv.startingDate,
//           closingDate: inv.closingDate,
//           totalPeriod: inv.totalPeriod,
//           milestoneReached: inv.mileStoneReached
//             ? `${inv.mileStoneReached}%`
//             : null,
//           investedAmount: inv.investedAmount,
//         }));

//         if (!cancelled) {
//           setRows(mapped);
//         }
//       } catch (e) {
//         if (!cancelled) {
//           // treat 404 as “no data”
//           if (e.response?.status === 404) {
//             setRows([]);
//           } else {
//             setError("Failed to load data.");
//           }
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   if (loading) {
//     return <Spin tip="Loading..." style={{ margin: 40, display: "block" }} />;
//   }

//   if (error) {
//     return <Alert type="error" message={error} style={{ margin: 24 }} />;
//   }

//   return (
//     <>
//       {rows.length === 0 ? (
//         <div style={{ textAlign: "center", paddingTop: 64 }}>
//           <Empty description="No previous ventures found" />
//         </div>
//       ) : (
//         <div style={{ padding: 24 }}>
//           <Row justify="start" style={{ marginBottom: 16 }}>
//             <Col xs={24} sm={12} md={8} lg={6}>
//               <Input
//                 size="small"
//                 placeholder="Search by investor or fund"
//                 prefix={<SearchOutlined />}
//                 value={search}
//                 onChange={e => setSearch(e.target.value)}
//                 allowClear
//               />
//             </Col>
//           </Row>
//           <Card bodyStyle={{ padding: 0 }}>
//             <Table
//               size="small"
//               columns={columns}
//               dataSource={filtered}
//               rowKey="id"
//               pagination={{ pageSize: 10 }}
//               bordered
//               scroll={{ x: true }}
//             />
//           </Card>
//         </div>
//       )}
//     </>
//   );
// }


// src/pages/PreviousVentures.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Empty,
  Spin,
  Alert,
  Typography,
  Row,
  Col,
  Input,
  Progress,
  Button,
} from "antd";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { api } from "../api";

const { Text } = Typography;

export default function PreviousVentures() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // fetch data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await api.get("/investments/getPreviousVentures", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const raw = Array.isArray(res.data["Previous Ventures: "])
          ? res.data["Previous Ventures: "]
          : [];
        const mapped = raw.map((inv) => ({
          id: inv.id,
          fundName: inv.fundDetails?.proposalName ?? "-",
          investorName: inv.investor?.name ?? "-",
          startingDate: inv.startingDate ?? "-",
          closingDate: inv.closingDate ?? "-",
          totalPeriod:
            inv.totalPeriod != null ? `${inv.totalPeriod} days` : "-",
          milestoneReached:
            inv.mileStoneReached != null
              ? `${inv.mileStoneReached}`
              : "0",
          investedAmount: inv.investedAmount ?? 0,
          numberOfInvestors:
            inv.numberOfInvestors != null ? inv.numberOfInvestors : "-",
        }));
        if (!cancelled) setRows(mapped);
      } catch (e) {
        if (!cancelled) {
          if (e.response?.status === 404) setRows([]);
          else setError("Failed to load previous ventures.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // search filter
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.fundName.toLowerCase().includes(term) ||
        r.investorName.toLowerCase().includes(term)
    );
  }, [rows, search]);

  if (loading) {
    return <Spin tip="Loading..." style={{ margin: 40, display: "block" }} />;
  }
  if (error) {
    return <Alert type="error" message={error} style={{ margin: 24 }} />;
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Search */}
      <Row style={{ marginBottom: 16 }} justify="end">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            size="small"
            // placeholder="Search by fund or investor"
            placeholder="Search"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      {/* Card grid */}
      {/* Empty state when no results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 64 }}>
          <Empty description="No previous ventures found" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((c) => {
            const percent = Math.min(100, parseFloat(c.milestoneReached) || 0);
            return (
              <Col key={c.id} xs={24} sm={12} md={12} lg={8} xl={6}>
                {(() => {
                  const titleText = c.fundName ?? "-";
                  const titleStyle = {
                    color: "#110379",
                    fontWeight: 600,
                    fontFamily: "'Segoe UI', sans-serif",
                    fontSize: 18,
                    lineHeight: "1.4",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    whiteSpace: "normal",
                  };

                  const rowStyle = {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  };

                  const valueStyle = {
                    flex: 1,
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
                        <div style={rowStyle}>
                          <Text strong>Investor Name:</Text>
                          <span style={valueStyle} title={c.investorName}>
                            {c.investorName ?? "-"}
                          </span>
                        </div>

                        <div style={rowStyle}>
                          <Text strong>Started Date:</Text>
                          <span style={valueStyle}>{c.startingDate ?? "-"}</span>
                        </div>

                        <div style={rowStyle}>
                          <Text strong>Closed Date:</Text>
                          <span style={valueStyle}>{c.closingDate ?? "-"}</span>
                        </div>

                        <div style={rowStyle}>
                          <Text strong>Duration:</Text>
                          <span style={valueStyle}>{c.totalPeriod ?? "-"}</span>
                        </div>

                        <div style={{ marginTop: 12 }}>
                          <Text strong>Milestone Reached: </Text> {percent}%
                        </div>
                        <Progress
                          percent={percent}
                          showInfo={false}
                          style={{ marginTop: 4 }}
                        />

                        <div style={rowStyle}>
                          <Text strong>Invested Amount:</Text>
                          <span style={valueStyle}>
                            ₹{c.investedAmount?.toLocaleString() ?? "0"}
                          </span>
                        </div>

                        <div style={rowStyle}>
                          <Text strong>Number of Investors:</Text>
                          <span style={valueStyle}>{c.numberOfInvestors ?? "-"}</span>
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
                        {/* <Button
                                        type="primary"
                                        shape="square"
                                        style={{
                                          width: 40,
                                          height: 40,
                                          padding: 0,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                        icon={
                                          <EyeOutlined
                                            style={{
                                              color: "#fff",
                                              marginLeft: 3,
                                            }}
                                          />
                                        }
                                      /> */}
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
