// src/pages/BusinessProfile.js
import React, { useState, useEffect } from "react";
import {
    Row,
    Col,
    Form,
    Input,
    Button,
    Typography,
    Card,
    Divider,
    Spin,
    Alert,
    Grid
} from "antd";
import { EyeOutlined, DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
// helper to extract file extension
const getExtension = (fn) => fn?.split(".").pop().toLowerCase();

export default function BusinessProfile() {
    const [form] = Form.useForm();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const history = useHistory();
    const screens = useBreakpoint();
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await api.get("/business/getMyBusiness", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // note the colon in the response key:
                const biz = res.data["Business:"] || {};

                if (!cancelled) {
                    setBusiness(biz);

                    // set form values with fallbacks
                    form.setFieldsValue({
                        businessName: biz.businessName || "—",
                        industrySector: biz.industrySector || "—",
                        businessType: biz.businessType || "N/A",
                        yearOfIncorporation: biz.yearOfIncorporation || "—",
                        registrationEmail: biz.registrationEmail || "—",
                        emailVerified: biz.emailVerified ? "Yes" : "No",
                        businessUrl: biz.businessUrl || "—",
                        contact: biz.contact || "0",
                        contactVerified: biz.contactVerified ? "Yes" : "No",
                        udyamAdharNumber: biz.udyamAdharNumber || "—",
                        gstCertificateNumber: biz.gstCertificateNumber || "—",
                        companyPanNumber: biz.companyPanNumber || "-"
                    });
                }
            } catch (e) {
                if (!cancelled) setError("Failed to load business details");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [form]);

    if (loading) {
        return <Spin tip="Loading business..." style={{ margin: 40, display: "block" }} />;
    }
    if (error) {
        return <Alert type="error" message={error} />;
    }

    // assemble document URLs
    const docs = [
        { key: "incCert", label: "Incorporation Certificate", url: business.incorporationCertificate },
        { key: "panDoc", label: "Company PAN Document", url: business.companyPanDoc },
        { key: "udyam", label: "Udyam Aadhaar Document", url: business.udyamAdharDoc },
        { key: "moa", label: "MOA Document", url: business.moaDoc },
        { key: "aoa", label: "AOA Document", url: business.aoaDoc },
        { key: "gst", label: "GST Certificate", url: business.gstDoc },
    ];

    const BACKEND = "https://api.925investor.com";

    function normalizeUrl(rawPath) {
        if (!rawPath) return null;
        // change Windows backslashes to slashes
        const normalized = rawPath.replace(/\\/g, "/");
        return `${BACKEND}/${normalized}`;
    }


    return (
        <div style={{ padding: 24, margin: "0 auto" }}>

            {/* <Row justify="space-between" align="middle">
                <Title level={3}>My Business Details</Title>
                <Button type="primary" onClick={() => history.push("/editBusinessProfile")}>
                    Edit Business
                </Button>
            </Row> */}

            <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
                {/* Title */}
                <Col>
                    <Title level={3}>My Business Details</Title>
                </Col>

                {/* Edit + Back */}
                <Col
                    style={{
                        display: "flex",
                        alignItems: "center",

                        // on mobile (< sm) spread them apart; on sm+ keep them snug
                        justifyContent: screens.sm ? "flex-start" : "space-between",
                        width: screens.sm ? "auto" : "100%",
                    }}
                >
                    <Button
                        type="primary"
                        className="cta-btn"
                        onClick={() => history.push("/editBusinessProfile")}
                    >
                        Edit Business
                    </Button>
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
                            // only give left‐margin on desktop; remove it on mobile
                            marginLeft: screens.sm ? 16 : 0,
                        }}
                        icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#fff" }} />}
                    />
                </Col>
            </Row>

            <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                <Row gutter={16}>
                    {[
                        ["businessName", "Business Name"],
                        ["industrySector", "Industry Sector"],
                        ["businessType", "Business Type"],
                        ["yearOfIncorporation", "Year of Incorporation"],
                        ["registrationEmail", "Registration Email"],
                        ["emailVerified", "Email Verified"],
                        ["contact", "Contact Number"],
                        ["contactVerified", "Contact Verified"],
                        ["businessUrl", "Business URL"],
                        ["udyamAdharNumber", "Udyam Aadhaar Number"],
                        ["gstCertificateNumber", "GST Certificate Number"],
                        ["companyPanNumber", "Company Pan Number"],
                    ].map(([name, label]) => (
                        <Col xs={24} sm={12} key={name}>
                            <Form.Item name={name} label={label}>
                                <Input disabled />
                            </Form.Item>
                        </Col>
                    ))}
                </Row>
            </Form>

            <Divider />

            <Title level={5}>Business Documents</Title>
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                {docs.map(({ key, label, url: rawPath }) => {
                    const fullUrl = normalizeUrl(rawPath);
                    const ext = fullUrl?.split(".").pop().toLowerCase();
                    const viewableExts = ["pdf", "jpg", "jpeg", "png", "gif"];

                    return (
                        <Col xs={24} sm={12} md={8} key={key}>
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

                                <div style={{ textAlign: "center", marginTop: 16 }}>
                                    {fullUrl ? (
                                        viewableExts.includes(ext) ? (
                                            <Button
                                                icon={<EyeOutlined />}
                                                type="link"
                                                size="small"
                                                href={fullUrl}
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
                                                href={fullUrl}
                                                download
                                            >
                                                Download Document
                                            </Button>
                                        )
                                    ) : (
                                        <Text type="secondary">No document uploaded</Text>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

        </div>
    );
}
