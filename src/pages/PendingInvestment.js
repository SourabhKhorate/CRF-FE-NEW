// src/pages/PendingInvestment.js
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
} from "antd";
import { SearchOutlined, ArrowLeftOutlined, DollarOutlined, FundOutlined, RiseOutlined, PercentageOutlined } from "@ant-design/icons";
import ReactApexChart from "react-apexcharts";
import { api } from "../api";
import { useHistory } from "react-router-dom";


const { Title, Text } = Typography;
const { Option } = Select;



export default function PendingInvestment() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ date: null, company: null });
    const history = useHistory();

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
                setLoading(true);
                const token = sessionStorage.getItem("token");

                // ───> CALL YOUR “BY‐STATUS” ENDPOINT DIRECTLY HERE  
                // e.g. to only fetch “Approved” investments:
                const res = await api.get(
                    "/investments/getInvestmentsOfInvestorByStatus",
                    {
                        params: { status: "Pending" },
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

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
                    // ───> NOW YOU ACTUALLY STORE THE STATUS FROM THE DTO
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

    // 2️⃣ Handle status changes
    // Handle status changes
    const handleStatusChange = (record, newStatus) => {
        // for “Approved” we show the modal
        if (newStatus === "Approved") {
            setConfirmModal({
                visible: true,
                record,
                oldStatus: record.status,
            });
            setCheckboxChecked(false);
            return;
        }

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
                endpoint = null;
                break;
            default:
                endpoint = null;
        }

        if (!endpoint) return;

        api
            .get(endpoint, {
                headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
            })
            .then((resp) => {
                if (resp.data.status) {
                    // show popup
                    message.success(`${newStatus} successfully`);
                    // update locally
                    setRows((r) =>
                        r.map((row) =>
                            row.id === record.id ? { ...row, status: newStatus } : row
                        )
                    );
                    // redirect to /myInvestment after a short delay so message is visible
                    setTimeout(() => history.push("/myInvestment"), 700);
                } else {
                    message.error(resp.data.message);
                }
            })
            .catch(() => {
                message.error("Server error");
            });
    };

    // Confirm OK for Approved
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
                const display = backendToDisplay[rawKey] || "Unknown";

                // Choices shown to the user
                const choices = ["Approve", "Reject", "Dealing", "On Hold"];

                // ⏳ Calculate if 7 days have passed
                const createdDate = new Date(record.created_at);
                const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
                const isFrozen = daysSinceCreated > 7;

                return (
                    <Select
                        value={display}
                        disabled={isFrozen} // Freeze after 7 days
                        onChange={(selectedDisplay) => {
                            const newBackendStatus = displayToBackend[selectedDisplay] || selectedDisplay;
                            setRows(rs =>
                                rs.map(r =>
                                    r.id === record.id ? { ...r, status: newBackendStatus } : r
                                )
                            );
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
        }


    ];


    const filtered = useMemo(() => {
        return rows.filter((inv) => {
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
                // ensure type-safe comparison between number/string
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

    const uniqueCompanies = Array.from(
        new Map(rows.map(r => [r.id, r.fundName])).entries()
    );

    return (
        <div style={{ padding: 24 }}>
            {/* … your Title, KPIs, Filters, Charts … */}

            {/* <Row justify="space-between" align="middle">
                <Title level={3}>Pending Investment</Title>
                <Button icon={<DownloadOutlined />}>Download Report</Button>
            </Row> */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <Title level={3}>Pending Handshakes</Title>
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

            {/* <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="Total Invested" value={kpis.totalInvested} prefix="$" /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="Fund Invested In" value={kpis.totalCompanies} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="Avg. Investment" value={Math.round(kpis.avgInvestment)} prefix="$" /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="Avg. Milestone %" value={Math.round(kpis.totalEquityPct)} suffix="%" /></Card></Col>
            </Row> */}

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

            {/* <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
                <Col span={24}><Card title="Investment per Fund"><ReactApexChart options={barChart.options} series={barChart.series} type="bar" height={300} /></Card></Col>
            </Row> */}

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
