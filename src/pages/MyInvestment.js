// src/pages/MyInvestment.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Empty,
  Spin,
  Alert,
  Typography,
  Row,
  Col,
  Input,
  Statistic,
  Button,
  Select,
  Modal,
  Checkbox,
  message,
  Badge,
} from "antd";
import { SearchOutlined, DollarOutlined, FundOutlined, RiseOutlined, PercentageOutlined } from "@ant-design/icons";
import ReactApexChart from "react-apexcharts";
import { api } from "../api";
import { useHistory } from "react-router-dom";


const { Title, Text } = Typography;
const { Option } = Select;

export default function MyInvestment() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ date: null, company: null });
  const history = useHistory();
  // add near the top with other useState
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [countsLoading, setCountsLoading] = useState(false);



  //   const valueStyle = {
  //   fontSize: "clamp(20px, 3.6vw, 28px)", // responsive font-size
  //   fontWeight: 700,
  //   lineHeight: 1.05,
  //   whiteSpace: "normal",
  //   wordBreak: "break-word",     // allow breaking at word boundaries
  //   overflowWrap: "anywhere",    // allow breaking anywhere if needed
  //   marginTop: 6,
  // };

  // const leftColStyle = {
  //   flex: "1 1 auto",
  //   minWidth: 0, // <- very important for allowing child to shrink/wrap
  // };

  // const iconCircle = (bg) => ({
  //   background: bg,
  //   padding: 12,
  //   width: 48,
  //   height: 48,
  //   borderRadius: "50%",
  //   display: "flex",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   color: "#fff",
  //   fontSize: 20,
  //   flex: "0 0 56px",
  // });



  // State for the “Approved” confirmation modal
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    record: null,
    oldStatus: null,
  });
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  // 1️⃣ Load investments
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await api.get("/investments/getInvestmentsByInvestor", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const invs = Array.isArray(res.data["Investments: "])
          ? res.data["Investments: "]
          : [];

        const mapped = invs.map((inv) => ({
          key: inv.id,
          id: inv.id,
          fundName: inv.fundDetails?.proposalName?.trim(),
          investorName: inv.investor?.name?.trim(),
          numberOfInvestors: inv.numberOfInvestors,
          startingDate: inv.startingDate,
          closingDate: inv.closingDate,
          totalPeriod: inv.totalPeriod,
          milestoneReached: inv.mileStoneReached
            ? `${inv.mileStoneReached}`
            : "0",
          investedAmount: inv.investedAmount,
          sector: inv.fundDetails?.sector,
          created_at: inv.createdAt,
          // status: inv.status || "Pending",
          status: inv.status ? inv.status.trim() : null,

        }));

        if (!cancelled) setRows(mapped);
      } catch (e) {
        if (!cancelled) {
          if (e.response?.status === 404) setRows([]);
          else setError("Failed to load data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch only counts for Pending and Approved handshakes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCountsLoading(true);
        const token = sessionStorage.getItem("token");
        if (!token) {
          if (!cancelled) {
            setPendingCount(0);
            setApprovedCount(0);
          }
          return;
        }

        // request both statuses in parallel
        const [pendingRes, approvedRes] = await Promise.all([
          api.get("/investments/getInvestmentsOfInvestorByStatus", {
            params: { status: "Pending" },
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: { "Investments: ": [] } })),
          api.get("/investments/getInvestmentsOfInvestorByStatus", {
            params: { status: "Approved" },
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: { "Investments: ": [] } })),
        ]);

        const pendingList = Array.isArray(pendingRes.data["Investments: "]) ? pendingRes.data["Investments: "] : [];
        const approvedList = Array.isArray(approvedRes.data["Investments: "]) ? approvedRes.data["Investments: "] : [];

        if (!cancelled) {
          setPendingCount(pendingList.length);
          setApprovedCount(approvedList.length);
        }
      } catch (e) {
        if (!cancelled) {
          setPendingCount(0);
          setApprovedCount(0);
          // optional: console.error(e);
        }
      } finally {
        if (!cancelled) setCountsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []); // run once on mount; you can add dependencies if needed (e.g. token)


  // 2️⃣ Handle status changes
  const handleStatusChange = (record, newStatus) => {
    // for “Approved” we show the modal
    if (newStatus === "Approved") {
      setConfirmModal({
        visible: true,
        record,
        oldStatus: record.status,
      });
      setCheckboxChecked(false);
    } else {
      // direct calls for other statuses
      let endpoint;
      switch (newStatus) {
        case "Rejected":
          endpoint = `/investments/rejectInvestment/${record.id}`;
          break;
        case "Dealing":
          endpoint = `/investments/dealingInvestment/${record.id}`;
          break;
        case "On Hold":
          endpoint = `/investments/onHoldInvestment/${record.id}`;
          break;
        case "Pending":
          // no-op or call a Pending endpoint if you have one
          endpoint = null;
          break;
        default:
          endpoint = null;
      }
      if (endpoint) {
        api
          .get(endpoint, { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } })
          .then((resp) => {
            if (resp.data.status) {
              message.success(`${newStatus} successfully`);
              // update locally
              setRows((r) =>
                r.map((row) =>
                  row.id === record.id ? { ...row, status: newStatus } : row
                )
              );
            } else {
              message.error(resp.data.message);
            }
          })
          .catch(() => {
            message.error("Server error");
          });
      }
    }
  };

  // 3️⃣ Confirm OK for Approved
  const handleModalOk = () => {
    const { record } = confirmModal;
    api
      .get(`/investments/approveInvestment/${record.id}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      })
      .then((resp) => {
        if (resp.data.status) {
          message.success("Approved successfully");
          // update locally
          setRows((r) =>
            r.map((row) =>
              row.id === record.id ? { ...row, status: "Approved" } : row
            )
          );
          // close modal then redirect to approvedInvestment after short delay
          setConfirmModal({ visible: false, record: null });
          setTimeout(() => history.push("/approvedInvestment"), 700);
        } else {
          message.error(resp.data.message);
          // keep modal open so user can retry or cancel
        }
      })
      .catch(() => {
        message.error("Server error");
      })
      .finally(() => {
        // ensure modal is closed if the above logic didn't already (safe-guard)
        setConfirmModal((s) => (s.visible ? { visible: false, record: null } : s));
      });
  };

  const handleModalCancel = () => {
    // revert select to old status
    const { record, oldStatus } = confirmModal;
    setRows((r) =>
      r.map((row) =>
        row.id === record.id ? { ...row, status: oldStatus } : row
      )
    );
    setConfirmModal({ visible: false, record: null });
  };

  // 4️⃣ Table columns, including the new Status dropdown
  const columns = [
    { title: "Id", key: "index", render: (_, __, idx) => idx + 1 },
    {
      title: "FUND NAME",
      dataIndex: "fundName",
      key: "fundName",
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "STARTED DATE",
      dataIndex: "startingDate",
      key: "startingDate",
      render: (v) => v || "—",
    },
    {
      title: "CLOSED DATE",
      dataIndex: "closingDate",
      key: "closingDate",
      render: (v) => v || "—",
    },
    {
      title: "DURATION",
      dataIndex: "totalPeriod",
      key: "totalPeriod",
      render: (v) => (v != null ? `${v} days` : "—"),
    },
    {
      title: "MILESTONE REACHED",
      dataIndex: "milestoneReached",
      key: "milestoneReached",
      render: (v) => v || "0%",
    },
    {
      title: "INVESTED AMOUNT",
      dataIndex: "investedAmount",
      key: "investedAmount",
      render: (v) =>
        v != null ? `₹${Number(v).toLocaleString()}` : "₹0",
    },
    {
      title: "NUMBER OF INVESTORS",
      dataIndex: "numberOfInvestors",
      key: "numberOfInvestors",
      render: (v) => (v != null ? v : "0"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        // mapping between backend values and UI labels
        const backendToDisplay = {
          "pending": "Pending",
          "approved": "Approve",
          "rejected": "Reject",
          "dealing": "Dealing",
          "on hold": "On Hold", // match whatever backend sends (trim/lower)
        };

        const displayToBackend = {
          "Pending": "Pending",
          "Approve": "Approved",
          "Reject": "Rejected",
          "Dealing": "Dealing",
          "On Hold": "On Hold",
        };

        // normalize server value (safe lowercase key)
        const raw = status ? status.trim() : "";
        const rawKey = raw.toLowerCase();

        // decide what to show as the Select value (e.g. "Approve" for "Approved")
        const display = backendToDisplay[rawKey] || "Unknown";

        // choices shown to the user (you said you want "Approve" / "Reject")
        // do not include "Pending" as an option if you want it frozen
        const choices = ["Approve", "Reject", "Dealing", "On Hold"];

        return (
          <Select
            value={display}
            onChange={(selectedDisplay) => {
              // map UI label back to backend value
              const newBackendStatus = displayToBackend[selectedDisplay] || selectedDisplay;

              // optimistic UI update — store backend string in rows so future renders map correctly
              setRows(rs =>
                rs.map(r =>
                  r.id === record.id ? { ...r, status: newBackendStatus } : r
                )
              );

              // call existing handler with the backend value (so it matches your API logic)
              handleStatusChange(record, newBackendStatus);
            }}
            style={{ width: 103 }}
          >
            {choices.map(opt => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Select>
        );
      },
    },

  ];


  const filtered = useMemo(() => {
    return rows.filter((inv) => {
      //  Skip Approved
      if ((inv.status?.trim().toLowerCase() === "approved") || (inv.status?.trim().toLowerCase() === "pending")) {
        return false;
      }

      const name = inv.fundName?.toLowerCase() || "";
      const investor = inv.investorName?.toLowerCase() || "";
      const searchTerm = search.toLowerCase();

      if (search && !name.includes(searchTerm) && !investor.includes(searchTerm)) {
        return false;
      }

      if (filters.date) {
        const created = new Date(inv.created_at);
        const diff = Date.now() - created;
        if (filters.date === "Last 30 Days" && diff > 1000 * 60 * 60 * 24 * 30)
          return false;
        if (filters.date === "Last 6 Months" && diff > 1000 * 60 * 60 * 24 * 30 * 6)
          return false;
        if (filters.date === "Last Year" && diff > 1000 * 60 * 60 * 24 * 365)
          return false;
      }

      if (filters.company) {
        if (String(inv.id) !== String(filters.company)) return false;
      }

      return true;
    });
  }, [rows, search, filters]);



  const kpis = useMemo(() => {
    const totalInvested = filtered.reduce((sum, r) => sum + (r.investedAmount || 0), 0);
    const distinctFunds = new Set(filtered.map(r => r.id)).size;
    const avgInvestment = filtered.length ? totalInvested / filtered.length : 0;
    const avgMilestone = filtered.length
      ? filtered.reduce((sum, r) => sum + (parseFloat(r.milestoneReached) || 0), 0) / filtered.length
      : 0;
    return {
      totalInvested,
      totalCompanies: distinctFunds,
      avgInvestment,
      totalEquityPct: avgMilestone,
    };
  }, [filtered]);

  const dataByFund = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = r.id;
      const name = r.fundName || "Unknown";
      const existing = map.get(key);
      if (existing) {
        existing.amt += r.investedAmount || 0;
      } else {
        map.set(key, { name, amt: r.investedAmount || 0 });
      }
    });
    return Array.from(map.values());
  }, [filtered]);

  const barChart = {
    series: [{ name: "Investment", data: dataByFund.map((d) => d.amt) }],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      xaxis: { categories: dataByFund.map((d) => d.name) },
      dataLabels: { enabled: false },
      plotOptions: {
        bar: { borderRadius: 4, columnWidth: "50%" },
      },
    },
  };

  if (loading) return <Spin tip="Loading..." style={{ margin: 40, display: "block" }} />;
  if (error) return <Alert type="error" message={error} style={{ margin: 24 }} />;

  const companyMap = rows.reduce((map, r) => {
    const id = r.id;
    const s = (r.status || "").trim().toLowerCase();
    if (!map[id]) map[id] = { name: r.fundName, hasOther: false };
    if (s !== "pending" && s !== "approved") map[id].hasOther = true;
    return map;
  }, {});

  const uniqueCompanies = Object.entries(companyMap)
    .filter(([_, v]) => v.hasOther)           // keep only companies with at least one non-pending/approved row
    .map(([id, v]) => [id, v.name]);


  return (
    <div style={{ padding: 24 }}>

      {/* <Row justify="space-between" align="middle">
        <Title level={3}>My Investment</Title>
        <Button icon={<DownloadOutlined />}>Download Report</Button>
      </Row> */}
      <Row
        justify="space-between"
        align="middle"
        style={{ flexWrap: "wrap", gap: "8px" }}
      >
        <Title
          level={3}
          style={{
            marginBottom: 0,
            flex: "1 1 auto",
            minWidth: "200px",
          }}
        >
          My Investment
        </Title>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            justifyContent: "flex-end",
            flex: "1 1 auto",
            width: "100%",
          }}
        >
          {/* Pending Handshakes with AntD Badge */}
          <Badge
            count={countsLoading ? <Spin size="small" /> : pendingCount}
            showZero={false}
            offset={[-11, 3]} // tweak to place badge at top-right
            style={{ backgroundColor: "#ff4d4f" }}
          >
            {/* IMPORTANT: wrap Button in an inline-block span */}
            <span style={{ display: "inline-block" }}>
              <Button
                size="small"
                onClick={() => history.push("/pendingInvestment")}
                style={{
                  color: "#fff",
                  backgroundColor: "#fda400ff",
                  borderColor: "#fda400ff",
                  height: 28,
                  lineHeight: "28px",
                  padding: "0 20px",
                  borderRadius: "8px",
                  fontSize: 12,
                  flex: "0 0 auto",
                  minWidth: 120,
                  width: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                className="handshake-btn"
              >
                Pending Handshakes
              </Button>
            </span>
          </Badge>



      {/* Pending Handshakes with AntD Badge */}
          <Badge
            // count={countsLoading ? <Spin size="small" /> : pendingCount}
            // showZero={false}
            // offset={[-11, 3]} // tweak to place badge at top-right
            // style={{ backgroundColor: "#ff4d4f" }}
          >
            {/* IMPORTANT: wrap Button in an inline-block span */}
            <span style={{ display: "inline-block" }}>

          <Button
            size="small"
            // type="primary"
            onClick={() => history.push("/approvedInvestment")}
            style={{
              height: 28,
              lineHeight: "28px",
              padding: "0 20px",
              fontSize: 12,
              flex: "0 0 auto",
              minWidth: 120,
              width: "auto",
            }}
            className="handshake-btn cta-btn-handshake"
          >
            Approved Handshakes
          </Button>
           </span>
          </Badge>
        </div>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={12}>
          <Card>
            <Statistic
              title="Pending Handshakes"
              value={pendingCount}
              loading={countsLoading}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={12}>
          <Card>
            <Statistic
              title="Approved Handshakes"
              value={approvedCount}
              loading={countsLoading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Total Invested" value={kpis.totalInvested} prefix="INR" /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Fund Invested In" value={kpis.totalCompanies} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Avg. Investment" value={Math.round(kpis.avgInvestment)} prefix="INR" /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Avg. Milestone %" value={Math.round(kpis.totalEquityPct)} suffix="%" /></Card></Col>


        {/* <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={leftColStyle}>
                <div style={{ fontSize: 14, color: "#777" }}>Total Invested</div>
                <div style={valueStyle}>
                  {`$${Number(kpis.totalInvested || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </div>
              </div>
              <div style={iconCircle("#1890ff")}>
                <DollarOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={leftColStyle}>
                <div style={{ fontSize: 14, color: "#777" }}>Fund Invested In</div>
                <div style={valueStyle}>
                  {String(kpis.totalCompanies ?? 0)}
                </div>
              </div>
              <div style={iconCircle("#52c41a")}>
                <FundOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={leftColStyle}>
                <div style={{ fontSize: 14, color: "#777" }}>Avg. Investment</div>
                <div style={valueStyle}>
                  {`$${Number(Math.round(kpis.avgInvestment || 0)).toLocaleString()}`}
                </div>
              </div>
              <div style={iconCircle("#fa8c16")}>
                <RiseOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={leftColStyle}>
                <div style={{ fontSize: 14, color: "#777" }}>Avg. Milestone %</div>
                <div style={valueStyle}>
                  {`${Math.round(kpis.totalEquityPct || 0)}%`}
                </div>
              </div>
              <div style={iconCircle("#722ed1")}>
                <PercentageOutlined />
              </div>
            </div>
          </Card>
        </Col> */}


      </Row>

      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 12 }}>
        <Col xs={24} sm={12} md={6}>
          <Select
            size="large"
            placeholder="Filter by Date"
            allowClear
            style={{ width: "100%" }}
            onChange={(val) => setFilters(f => ({ ...f, date: val }))}
          >
            <Option value="Last 30 Days">Last 30 Days</Option>
            <Option value="Last 6 Months">Last 6 Months</Option>
            <Option value="Last Year">Last Year</Option>
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            size="large"
            placeholder="Filter by Fund"
            allowClear
            style={{ width: "100%" }}
            onChange={(val) => setFilters(f => ({ ...f, company: val }))}
          >
            {uniqueCompanies.map(([id, name]) => (
              <Option key={id} value={id}>{name}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Input
            size="small"
            placeholder="Search"
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ width: "100%" }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col span={24}><Card title="Investment per Fund"><ReactApexChart options={barChart.options} series={barChart.series} type="bar" height={300} /></Card></Col>
      </Row>

      <Card>
        {rows.length === 0 ? (
          <Empty description="No Business Investment found" />
        ) : (
          <Table
            size="small"
            columns={columns}
            dataSource={filtered}
            rowKey="key"
            pagination={{ pageSize: 10 }}
            bordered
            scroll={{ x: true }}
          />
        )}
      </Card>

      {/* Approval Confirmation Modal */}
      <Modal
        title="Confirm Approval"
        visible={confirmModal.visible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okButtonProps={{ disabled: !checkboxChecked }}
      >
        <Checkbox
          checked={checkboxChecked}
          onChange={(e) => setCheckboxChecked(e.target.checked)}
        >
          By approving this Investment, you are agreeing the Business to pay
          the mentioned amount in the Handshake. For any complications,
          OneGO will not be considered accountable.
        </Checkbox>
      </Modal>
    </div>
  );
}
