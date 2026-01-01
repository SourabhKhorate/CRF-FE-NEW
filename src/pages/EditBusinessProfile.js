// src/pages/EditBusinessProfile.js
import React, { useState, useEffect } from "react";
import {
    Row,
    Col,
    Form,
    Input,
    Button,
    Typography,
    Upload,
    Divider,
    Spin,
    Alert,
    message,
} from "antd";
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";


const { Title, Text } = Typography;

const BACKEND = "https://api.925investor.com";

function normalizeUrl(rawPath) {
    if (!rawPath) return null;
    return `${BACKEND}/${rawPath.replace(/\\/g, "/")}`;
}

function toFileList(rawPath) {
    const url = normalizeUrl(rawPath);
    return url
        ? [{ uid: "-1", name: url.split("/").pop(), status: "done", url }]
        : [];
}

const PASSWORD_RULES = [
    { test: (pw) => pw.length >= 8, message: "Minimum 8 characters are required" },
    { test: (pw) => /[A-Z]/.test(pw), message: "At least one uppercase letter" },
    { test: (pw) => /[a-z]/.test(pw), message: "At least one lowercase letter" },
    { test: (pw) => /\d/.test(pw), message: "At least one number" },
    { test: (pw) => /[\W_]/.test(pw), message: "At least one special character" },
];

export default function EditBusinessProfile() {
    const [form] = Form.useForm();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const history = useHistory();


    const pwValue = Form.useWatch("password", form) || "";
    const results = PASSWORD_RULES.map((r) => r.test(pwValue));
    const allPass = results.every(Boolean);

    // load existing details
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await api.get("/business/getMyBusiness", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const biz = res.data["Business:"] || {};
                if (cancelled) return;
                setBusiness(biz);

                form.setFieldsValue({
                    // read‑only scalars
                    registrationEmail: biz.registrationEmail || "",
                    businessName: biz.businessName || "",

                    // editable text
                    companyPanNumber: biz.companyPanNumber || "",
                    udyamAdharNumber: biz.udyamAdharNumber || "",
                    gstCertificateNumber: biz.gstCertificateNumber || "",
                    password: biz.password || "",

                    // existing uploads
                    incorporationCertificate: toFileList(biz.incorporationCertificate),
                    companyPanDoc: toFileList(biz.companyPanDoc),
                    udyamAdharDoc: toFileList(biz.udyamAdharDoc),
                    moaDoc: toFileList(biz.moaDoc),
                    aoaDoc: toFileList(biz.aoaDoc),
                    gstDoc: toFileList(biz.gstDoc),
                });
            } catch {
                if (!cancelled) setError("Failed to load business details");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [form]);

    const normFile = (e) => (Array.isArray(e) ? e : e && e.fileList);

    if (loading) {
        return <Spin tip="Loading..." style={{ margin: 40, display: "block" }} />;
    }
    if (error) {
        return <Alert type="error" message={error} />;
    }

    const onFinish = async (values) => {
        setSaving(true);

        // 1️⃣ Build multipart form data
        const formData = new FormData();

        // – text fields
        formData.append("companyPanNumber", values.companyPanNumber || "");
        formData.append("udyamAdharNumber", values.udyamAdharNumber || "");
        formData.append("gstCertificateNumber", values.gstCertificateNumber || "");
        formData.append("password", values.password || "");

        // – file fields
        const pickFile = (fileList) =>
            Array.isArray(fileList) && fileList[0] && fileList[0].originFileObj;

        [
            "incorporationCertificate",
            "companyPanDoc",
            "udyamAdharDoc",
            "moaDoc",
            "aoaDoc",
            "gstDoc",
        ].forEach((field) => {
            const file = pickFile(values[field]);
            if (file) {
                // must match your DTO field name exactly
                formData.append(field, file);
            }
        });

        try {
            const token = sessionStorage.getItem("token");
            const res = await api.post("/business/addBusinessDetails", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // let axios set Content-Type multipart/form-data boundary
                },
            });

            if (res.data.status) {
                message.success("Profile updated successfully.");
                history.push("/businessProfile"); // redirect
            } else {
                message.error(res.data.message || "Update failed");
            }
        } catch {
            message.error("Error while Updating");
        } finally {
            setSaving(false);
        }
    };


    // Regex patterns
    const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    // Udyam: either 12 digits OR UDYAM-<ST>-<8 digits>
    const UDYAM_REGEX = /^(?:\d{12}|UDYAM-[A-Z]{2}-\d{8})$/;
    const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

    const preventSpecialChars = (e) => {
        const key = e.key;
        const regex = /^[a-zA-Z0-9-]$/; // allow letters, numbers, and dash
        if (!regex.test(key)) {
            e.preventDefault();
        }
    };

    return (
        <div style={{ padding: 24, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <Title level={3}>Edit Business Profile</Title>
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


            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                    {/* read‑only */}
                    <Col xs={24} sm={12}>
                        <Form.Item name="registrationEmail" label="Registration Email">
                            <Input disabled />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item name="businessName" label="Business Name">
                            <Input disabled />
                        </Form.Item>
                    </Col>

                    {/* editable text */}
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="companyPanNumber"
                            label="Company PAN Number"
                            normalize={(value) => (value || "").toUpperCase()}
                            rules={[
                                { required: true, message: "Company PAN Number is required" },
                                {
                                    pattern: PAN_REGEX,
                                    message: "Invalid PAN format (e.g. AAAAA9999A)",
                                },
                            ]}
                        >
                            <Input
                                maxLength={10}
                                onKeyPress={preventSpecialChars}
                                style={{ textTransform: "uppercase" }}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="udyamAdharNumber"
                            label="Udyam Aadhaar Number"
                            normalize={(value) => (value || "").toUpperCase()}
                            rules={[
                                { required: true, message: "Udyam Aadhaar Number is required" },
                                {
                                    pattern: UDYAM_REGEX,
                                    message:
                                        "Must be 12 digits (e.g. 123456789012) or UDYAM‑<ST>‑00012345 (e.g. UDYAM-MH-00012345)",
                                },
                            ]}
                        >
                            <Input
                                maxLength={17}
                                onKeyPress={preventSpecialChars}
                                style={{ textTransform: "uppercase" }}
                            />
                        </Form.Item>
                    </Col>


                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="gstCertificateNumber"
                            label="GST Certificate Number"
                            normalize={(value) => (value || "").toUpperCase()}
                            rules={[
                                { required: true, message: "GST Certificate Number is required" },
                                {
                                    pattern: GST_REGEX,
                                    message: "Invalid GST format (e.g. 27AACCM9910C1Z2)",
                                },
                            ]}
                        >
                            <Input
                                maxLength={15}
                                onKeyPress={preventSpecialChars}
                                style={{ textTransform: "uppercase" }}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                        {/* <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: "Please Enter your password" }]}
                        >
                            <Input.Password size="small" />
                        </Form.Item> */}

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[
                                { required: true, message: "Please create a password" },
                                // this validator runs after every change & on submit:
                                () => ({
                                    validator(_, value) {
                                        if (!value) {
                                            // required rule will show first if empty
                                            return Promise.resolve();
                                        }
                                        // run through your PASSWORD_RULES array
                                        const failedRule = PASSWORD_RULES.find((r) => !r.test(value));
                                        if (failedRule) {
                                            // reject with its message
                                            return Promise.reject(new Error(failedRule.message));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                            hasFeedback
                            validateFirst
                        >
                            <Input.Password placeholder="Create a password" size="small" />
                        </Form.Item>

                        {pwValue.length > 0 && !allPass && (
                            <div style={{ marginTop: -16, marginBottom: 24, paddingLeft: 8 }}>
                                {PASSWORD_RULES.map((rule, idx) => {
                                    const passed = results[idx];
                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                color: passed ? "green" : "red",
                                                fontSize: "0.9em",
                                                lineHeight: "1.2",
                                            }}
                                        >
                                            {passed ? (
                                                <CheckCircleOutlined style={{ marginRight: 4 }} />
                                            ) : (
                                                <CloseCircleOutlined style={{ marginRight: 4 }} />
                                            )}
                                            <Text>{rule.message}</Text>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </Col>
                </Row>

                <Divider />
                <Title level={5}>Business Documents</Title>

                <Row gutter={[16, 16]}>
                    {[
                        ["incorporationCertificate", "Incorporation Certificate"],
                        ["companyPanDoc", "Company PAN"],
                        ["udyamAdharDoc", "Udyam Aadhaar"],
                        ["moaDoc", "MOA Document"],
                        ["aoaDoc", "AOA Document"],
                        ["gstDoc", "GST Certificate"],
                    ].map(([name, label]) => (
                        <Col xs={24} md={12} key={name}>
                            <Form.Item
                                label={label}
                                name={name}
                                valuePropName="fileList"
                                getValueFromEvent={normFile}
                            >
                                <Upload
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    listType="text"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                                    style={{ width: "100%" }}
                                    showUploadList={{ showRemoveIcon: false }}
                                >
                                    <Button icon={<UploadOutlined />} block size="large" style={{
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        Upload {label}
                                    </Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                    ))}
                </Row>

                <Row justify="end" style={{ marginTop: 24 }}>
                    <Button type="primary" className="cta-btn" htmlType="submit" loading={saving}>
                        Save Changes
                    </Button>
                </Row>
            </Form>
        </div>
    );
}
