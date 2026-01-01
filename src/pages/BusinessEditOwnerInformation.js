// src/pages/BusinessEditOwnerInformation.js
import React, { useState, useEffect } from "react";
import {
    Row,
    Col,
    Form,
    Input,
    Button,
    Upload,
    Typography,
    Spin,
    Alert,
    message,
    Divider,
} from "antd";
import { UploadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useParams, useHistory } from "react-router-dom";
import { api } from "../api";

const { Title } = Typography;
const BACKEND = "https://api.925investor.com";

// file-list normalizer for Upload
const normFile = (e) => (Array.isArray(e) ? e : e && e.fileList);

// build URL from raw path
// const normalizeUrl = (rawPath) =>
//   rawPath ? `${process.env.REACT_APP_BACKEND}/${rawPath.replace(/\\/g, "/")}` : null;

function normalizeUrl(rawPath) {
    return rawPath ? `${BACKEND}/${rawPath.replace(/\\/g, '/')} ` : null;
}

// convert existing path → Upload fileList
const toFileList = (rawPath) => {
    const url = normalizeUrl(rawPath);
    return url
        ? [{ uid: "-1", name: url.split("/").pop(), status: "done", url }]
        : [];
};

// regex validators
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// Prevent non-numeric for Aadhaar
const preventNonNumeric = e => {
    if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
    }
};

export default function BusinessEditOwnerInformation() {
    const { ownerId } = useParams();
    const history = useHistory();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fetch existing owner
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.get(
                    `/owners/getOwnerByOwnerId/${ownerId}`,
                    { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } }
                );
                const owner = data["Owner: "] || {};
                if (cancelled) return;
                // Pre-fill form
                form.setFieldsValue({
                    ownerName: owner.ownerName,
                    dinNumber: owner.dinNumber,
                    ownerPanNumber: owner.ownerPanNumber,
                    ownerAadharNumber: owner.ownerAadharNumber,
                    ownerEmail: owner.ownerEmail,
                    ownerContact: owner.ownerContact,
                    ownerPanDoc: toFileList(owner.ownerPanDoc),
                    ownerAadharDocFront: toFileList(owner.ownerAadharDocFront),
                    ownerAadharDocBack: toFileList(owner.ownerAadharDocBack),
                });
            } catch (e) {
                console.error(e);
                if (!cancelled) setError("Failed to load owner details.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [ownerId, form]);

    // handle submit
    const onFinish = async (values) => {
        setSaving(true);
        const fd = new FormData();

        // JSON part
        const dto = {
            ownerName: values.ownerName,
            dinNumber: values.dinNumber,
            ownerPanNumber: values.ownerPanNumber,
            ownerAadharNumber: values.ownerAadharNumber,
            ownerEmail: values.ownerEmail,
            ownerContact: values.ownerContact,
        };
        fd.append(
            "ownersRequestDTO",
            new Blob([JSON.stringify(dto)], { type: "application/json" })
        );

        // file parts
        const fileOf = (list) => list?.[0]?.originFileObj;
        if (fileOf(values.ownerPanDoc)) {
            fd.append("owner_pan_doc", fileOf(values.ownerPanDoc));
        }
        if (fileOf(values.ownerAadharDocFront)) {
            fd.append("owner_adhar_doc_front", fileOf(values.ownerAadharDocFront));
        }
        if (fileOf(values.ownerAadharDocBack)) {
            fd.append("owner_adhar_doc_back", fileOf(values.ownerAadharDocBack));
        }

        try {
            const { data } = await api.post(
                `/owners/editOwner/${ownerId}`,
                fd,
                {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                    },
                }
            );
            if (data.status) {
                message.success("Owner updated successfully");
                history.push("/businessOwnersList");
            } else {
                throw new Error(data.message || "Update failed");
            }
        } catch (e) {
            console.error(e);
            message.error(e.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Spin tip="Loading owner..." style={{ margin: 40, display: "block" }} />;
    }
    if (error) {
        return <Alert type="error" message={error} style={{ margin: 40 }} />;
    }

    return (
        <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>
            {/* <Title level={3}>Edit Owner Information</Title> */}
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
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                    {/* Name */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="ownerName"
                            label="Name"
                            rules={[{ required: true, message: "Please enter a name" }]}
                        >
                            <Input placeholder="Co-owner / Director name" />
                        </Form.Item>
                    </Col>

                    {/* DIN */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="dinNumber"
                            label="DIN Number"
                            rules={[{ required: true, message: "Please enter DIN Number" }]}
                        >
                            <Input placeholder="Enter DIN or PIN" />
                        </Form.Item>
                    </Col>

                    {/* PAN Number */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="ownerPanNumber"
                            label="PAN Number"
                            normalize={v => (v || '').toUpperCase()} rules={[{ required: true, message: 'Please enter your PAN number' }, { pattern: PAN_REGEX, message: 'PAN format: AAAAA9999A' }]} hasFeedback>
                            <Input placeholder='XXXXX9999X' maxLength={10} style={{ textTransform: 'uppercase' }} size="small" />
                        </Form.Item>
                    </Col>

                    {/* Aadhaar Number */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="ownerAadharNumber"
                            label="Aadhaar Number"
                            rules={[{ required: true, message: 'Please enter your Aadhaar number' }, { pattern: AADHAR_REGEX, message: 'Aadhaar must be 12 digits' }]} hasFeedback>
                            <Input placeholder='XXXXXXXXXXXX' maxLength={12} onKeyPress={preventNonNumeric} size="small" />
                        </Form.Item>
                    </Col>

                    {/* Email */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="ownerEmail"
                            label="Email Address"
                            rules={[
                                { required: true, message: "Please enter email address" },
                                { type: "email", message: "Enter a valid email" },
                            ]}
                        >
                            <Input placeholder="Enter email" />
                        </Form.Item>
                    </Col>

                    {/* Mobile */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="ownerContact"
                            label="Mobile Number"
                            rules={[
                                { required: true, message: "Please enter contact number" },
                                { pattern: /^\d{10}$/, message: "Enter a 10‑digit phone number" },
                            ]}
                        >
                            <Input
                                placeholder="10‑digit mobile number"
                                maxLength={10}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                onKeyPress={e => {
                                    if (!/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Divider />
                        <Title level={5} style={{ marginBottom: 12 }}>
                            Owner Documents
                        </Title>
                    </Col>

                    {/* PAN Doc */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="ownerPanDoc"
                            label="Upload PAN"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.jpg,.png" showUploadList={{ showRemoveIcon: false }}>
                                <Button icon={<UploadOutlined />} block style={{
                                    width: '100%',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    Upload PAN
                                </Button>
                            </Upload>
                        </Form.Item>
                    </Col>

                    {/* Aadhaar Front */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="ownerAadharDocFront"
                            label="Upload Aadhaar (Front)"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.jpg,.png" showUploadList={{ showRemoveIcon: false }}>
                                <Button icon={<UploadOutlined />} block style={{
                                    width: '100%',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    Upload Aadhaar Front
                                </Button>
                            </Upload>
                        </Form.Item>
                    </Col>

                    {/* Aadhaar Back */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="ownerAadharDocBack"
                            label="Upload Aadhaar (Back)"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.jpg,.png" showUploadList={{ showRemoveIcon: false }}>
                                <Button icon={<UploadOutlined />} block style={{
                                    width: '100%',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    Upload Aadhaar Back
                                </Button>
                            </Upload>
                        </Form.Item>
                    </Col>

                    {/* Submit */}
                    <Col span={24} style={{ textAlign: "right" }}>
                        <Form.Item>
                            <Button type="primary" className="cta-btn" htmlType="submit" loading={saving}>
                                Save Changes
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
