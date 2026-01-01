import React, { useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { api } from "../api";
import {
    Row,
    Col,
    Card,
    Typography,
    Descriptions,
    Spin,
    Alert,
    Button,
    Progress
} from "antd";
import "./css/FundDetailsPage.css";
import { EyeOutlined, DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;


const BACKEND = "https://api.925investor.com";
export default function FundDetailsPage() {
    const { id } = useParams();
    const history = useHistory();
    const [fund, setFund] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let canceled = false;
        (async () => {
            try {
                const token = sessionStorage.getItem("token");
                const { data } = await api.get(`/fundDetails/getById/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fundData =
                    data.fund ?? data["Funds: "] ?? data["Funds "] ?? data;
                if (!canceled) setFund(fundData || {});
            } catch {
                if (!canceled) setError("Unable to load fund details.");
            } finally {
                if (!canceled) setLoading(false);
            }
        })();
        return () => { canceled = true; };
    }, [id]);

    if (loading) return <Spin tip="Loading fund..." style={{ display: "block", margin: "20px auto" }} />;
    if (error) return <Alert type="error" message={error} />;

    const {
        proporalName = "—",
        targetedFund = 0,
        raisedFund = 0,
        status,
        numberOfInvestors,
        fundStartingDate,
        fundClosingDate,
        sector,
        equityOffered,
        valuation,
        investmentType,
        projectReport,
        pitch,
        companyProfile,
        video
    } = fund || {};

    const percent = targetedFund > 0 && raisedFund != null
        ? Math.min(100, Math.round((raisedFund / targetedFund) * 100))
        : 0;

    return (
        <div className="fund-detail-page">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <Button
                    onClick={() => history.goBack()}
                    className="cta-btn"
                    shape="circle"
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
            {/* Top KPI cards */}
            <Row gutter={[16, 16]} className="fund-kpi-row">
                {/* Raised amount */}
                <Col xs={24} sm={12} md={8}>
                    <Card className="kpi-card">
                        <Text className="kpi-value">
                            INR {typeof raisedFund === "number" ? raisedFund.toLocaleString() : 0}
                        </Text>
                        <Text className="kpi-label">Raised</Text>
                    </Card>
                </Col>

                {/* Goal amount */}
                <Col xs={24} sm={12} md={8}>
                    <Card className="kpi-card">
                        <Text className="kpi-value">
                            INR {typeof targetedFund === "number" ? targetedFund.toLocaleString() : 0}
                        </Text>
                        <Text className="kpi-label">Goal</Text>
                    </Card>
                </Col>

                {/* Funded % */}
                <Col xs={24} sm={12} md={8}>
                    <Card className="kpi-card">
                        <Progress
                            type="circle"
                            percent={percent}
                            width={80}
                            strokeWidth={8}
                        />
                        <Text className="kpi-label">Funded</Text>
                    </Card>
                </Col>
            </Row>

            {/* Details Section */}
            <section className="fund-detail-section">
                <Text strong style={{ fontSize: '18px', color: '#110379' }}>
                    General Details: <span>{proporalName}</span>
                </Text>

                <Descriptions
                    bordered
                    column={1}
                    size="middle"
                    labelStyle={{ width: '50%', fontWeight: 500 }}
                    contentStyle={{ width: '50%' }}
                    style={{ marginTop: 12 }}
                >
                    <Descriptions.Item label="Status">{status || "—"}</Descriptions.Item>
                    <Descriptions.Item label="Investors">{typeof numberOfInvestors === "number" ? numberOfInvestors : "—"}</Descriptions.Item>
                    <Descriptions.Item label="Start Date">
                        {fundStartingDate
                            ? new Date(fundStartingDate).toLocaleDateString()
                            : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Close Date">
                        {fundClosingDate
                            ? new Date(fundClosingDate).toLocaleDateString()
                            : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Sector">{sector || "—"}</Descriptions.Item>
                    <Descriptions.Item label="Equity Offered">
                        {typeof equityOffered === "number" ? `${equityOffered}%` : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Valuation">
                        {typeof valuation === "number" ? `₹${valuation.toLocaleString()}` : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Investment Type">{investmentType || "—"}</Descriptions.Item>
                </Descriptions>

                {/* Extra info as 3-col responsive */}


                {/* …inside your render: */}
                {/* <div className="fund-extra-info">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Text strong>Project Report:</Text>{" "}
                            {projectReport ? (
                                (() => {
                                    const url = `${BACKEND}/${projectReport.replace(/\\/g, "/")}`;
                                    const lower = url.toLowerCase();

                                    if (lower.endsWith(".pdf")) {
                                        return (
                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                View Document
                                            </a>
                                        );
                                    } else if (lower.endsWith(".doc") || lower.endsWith(".docx") ||
                                        lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
                                        return (
                                            <a href={url} download>
                                                Download Document
                                            </a>
                                        );
                                    } else {
                                        return (
                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                View Document
                                            </a>
                                        );
                                    }
                                })()
                            ) : (
                                "N/A"
                            )}
                        </Col>

                        <Col xs={24} md={8}>
                            <Text strong>Pitch:</Text>{" "}
                            {pitch ? (
                                (() => {
                                    const url = `${BACKEND}/${pitch.replace(/\\/g, "/")}`;
                                    const lower = url.toLowerCase();

                                    if (lower.endsWith(".pdf")) {
                                        return (
                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                View Document
                                            </a>
                                        );
                                    } else if (lower.endsWith(".doc") || lower.endsWith(".docx") ||
                                        lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
                                        return (
                                            <a href={url} download>
                                                Download Document
                                            </a>
                                        );
                                    } else {
                                        return (
                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                View Document
                                            </a>
                                        );
                                    }
                                })()
                            ) : (
                                "N/A"
                            )}
                        </Col>

                        <Col xs={24} md={8}>
                            <Text strong>Company Profile:</Text>{" "}
                            {companyProfile ? (
                                (() => {
                                    const url = `${BACKEND}/${companyProfile.replace(/\\/g, "/")}`;
                                    const lower = url.toLowerCase();

                                    if (lower.endsWith(".pdf")) {
                                        return (
                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                View Document
                                            </a>
                                        );
                                    } else if (lower.endsWith(".doc") || lower.endsWith(".docx") ||
                                        lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
                                        return (
                                            <a href={url} download>
                                                Download Document
                                            </a>
                                        );
                                    } else {
                                        return (
                                            <a href={url} target="_blank" rel="noopener noreferrer">
                                                View Document
                                            </a>
                                        );
                                    }
                                })()
                            ) : (
                                "N/A"
                            )}
                        </Col>
                    </Row>
                </div> */}

                <div className="fund-extra-info" style={{ marginTop: 24 }}>
                    <Row gutter={[16, 16]}>
                        {[
                            ["Project Report", projectReport],
                            ["Pitch", pitch],
                            ["Company Profile", companyProfile],
                        ].map(([label, path]) => {
                            const url = path ? `${BACKEND}/${path.replace(/\\/g, "/")}` : null;
                            const lower = url?.toLowerCase();
                            const isPdf = lower?.endsWith(".pdf") || lower?.endsWith(".jpg") ||
                                lower?.endsWith(".jpeg") || lower?.endsWith(".png") ||
                                lower?.endsWith(".gif");
                            const isDoc = lower?.endsWith(".doc") ||
                                lower?.endsWith(".docx") ||
                                lower?.endsWith(".xls") ||
                                lower?.endsWith(".xlsx");

                            return (
                                <Col xs={24} sm={12} md={8} key={label}>
                                    <Card
                                        size="small"
                                        bodyStyle={{
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                            minHeight: 120,
                                            padding: 24,
                                        }}
                                        style={{
                                            borderRadius: 12,
                                            border: "1px solid #f0f0f0",
                                            boxShadow: "none",
                                        }}
                                    >
                                        <Text strong>{label}</Text>

                                        <div style={{ marginTop: 16, textAlign: "left" }}>
                                            {url ? (
                                                isPdf ? (
                                                    <Button
                                                        icon={<EyeOutlined />}
                                                        type="link"
                                                        size="small"
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        View Document
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        icon={<DownloadOutlined />}
                                                        type="link"
                                                        size="small"
                                                        href={url}
                                                        download
                                                    >
                                                        Download Document
                                                    </Button>
                                                )
                                            ) : (
                                                <Text type="secondary">N/A</Text>
                                            )}
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </div>


                {/* <div className="fund-video">
                    <Title level={4}>Video</Title>
                    {video ? (
                        <video
                            width="100%"
                            height="300"
                            controls
                            src={${BACKEND} /${video.replace(/\\/g, "/")}}
                    style={{ objectFit: "cover" }}
                        />
                    ) : (
                    <Text type="secondary">No video available</Text>
                    )}
                </div> */}

                <div className="fund-video">
                    <Title level={4}>Video</Title>
                    {video ? (
                        <div className="video-wrapper">
                            <video
                                controls
                                src={`${BACKEND}/${video.replace(/\\/g, "/")}`}
                            />
                        </div>
                    ) : (
                        <Text type="secondary">No video available</Text>
                    )}
                </div>

                {/* <div className="fund-video">
                    <Title level={4}>Video</Title>
                    {video ? (
                        <div
                            style={{
                                position: "relative",
                                width: "100%",
                                paddingBottom: "56.25%",    
                                maxHeight: 400,              
                                overflow: "hidden",
                                borderRadius: 8,
                            }}
                        >
                            <video
                                controls
                                src={`${BACKEND}/${video.replace(/\\/g, "/")}`}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                    ) : (
                        <Text type="secondary">No video available</Text>
                    )}
                </div> */}


            </section>
        </div>
    );
}
