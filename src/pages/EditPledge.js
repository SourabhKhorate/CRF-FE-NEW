// src/pages/EditPledge.js
import React, { useState, useEffect } from "react";
import {
    Card,
    Form,
    Row,
    Col,
    Input,
    InputNumber,
    DatePicker,
    Button,
    Typography,
    message,
    Spin,
    Alert,
} from "antd";
import { useHistory, useParams } from "react-router-dom";
import moment from "moment";
import { api } from "../api";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function EditPledge() {
    const [form] = Form.useForm();
    const history = useHistory();
    const { pledgeId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // hold these from the fetched DTO
    const [fundId, setFundId] = useState(null);
    const [investorId, setInvestorId] = useState(null);
    const [fundName, setFundName] = useState("");

    // Fetch existing pledge
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const token = sessionStorage.getItem("token");
                const resp = await api.get(`/pledges/getPledgeById/${pledgeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const dto = resp.data["Pledges: "]; // Note the space in key
                if (!cancelled && dto) {
                    // Defensive access to nested objects
                    const fundDetails = dto.fundDetails || {};
                    const investorDetails = dto.investor || {};

                    // Set state with fallback values
                    setFundId(fundDetails.id ?? null);
                    setInvestorId(investorDetails.id ?? null);
                    setFundName(fundDetails.proporalName || "");

                    // Set form fields
                    form.setFieldsValue({
                        fundName: fundDetails.proporalName || "",
                        pledgedAmount: dto.pledgedAmount ? Number(dto.pledgedAmount) : null,
                        numberOfInvestors: dto.numberOfInvestors ? Number(dto.numberOfInvestors) : null,
                        equityExpected: dto.equityExpected ? Number(dto.equityExpected) : null,
                        pledgeStartingDate: dto.startingDate
                            ? moment(dto.startingDate, "YYYY-MM-DD")
                            : null,
                        pledgeClosingDate: dto.closingDate
                            ? moment(dto.closingDate, "YYYY-MM-DD")
                            : null,
                    });
                }
            } catch (e) {
                console.error(e);
                if (!cancelled) setError("Failed to load pledge details");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [pledgeId, form]);


    const onFinish = async (values) => {
        const payload = {
            id: Number(pledgeId),               // ← include the pledge’s own id
            fundId: Number(fundId),             // ← original fund
            investorId: Number(investorId),     // ← original investor
            pledgedAmount: values.pledgedAmount.toString(),
            numberOfInvestors: values.numberOfInvestors.toString(),
            equityExpected: values.equityExpected.toString(),
            startingDate: values.pledgeStartingDate.format("YYYY-MM-DD"),
            closingDate: values.pledgeClosingDate.format("YYYY-MM-DD"),
        };

        // console.log("Submitting payload:", payload);

        try {
            setSaving(true);
            const token = sessionStorage.getItem("token");
            const resp = await api.put(
                `/pledges/editPledge/${pledgeId}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Server response:", resp.data);

            if (resp.data.status) {
                message.success("Pledge updated successfully!");
                history.goBack();
            } else {
                message.error(resp.data.message || "Update failed");
            }
        } catch (e) {
            console.error("Error response data:", e.response?.data);
            message.error(
                e.response?.data?.message ||
                "Server rejected the request. Check the console."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spin style={{ margin: 40, display: "block" }} />;
    if (error) return <Alert type="error" message={error} style={{ margin: 24 }} />;

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
                <Title level={3}>Edit Pledge</Title>
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

            <Card>
                {/* <Title level={4}>Edit Pledge</Title> */}
                <Form form={form} layout="vertical" onFinish={onFinish}>

                    <Row gutter={16}>
                        {/* Read-only Fund Name */}
                        <Col xs={24} md={12}>
                            <Form.Item label="Fund Name" name="fundName">
                                <Input disabled />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="pledgedAmount"
                                label="Pledged Amount"
                                rules={[{ required: true, message: "Enter pledged amount" }]}
                            >
                                <InputNumber
                                    size="large"
                                    style={{ width: "100%" }}
                                    min={0}
                                    placeholder="Enter amount"
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) e.preventDefault();
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="numberOfInvestors"
                                label="Number of Investors"
                                rules={[{ required: true, message: "Enter number of investors" }]}
                            >
                                <InputNumber
                                    size="large"
                                    style={{ width: "100%" }}
                                    min={1}
                                    placeholder="Enter count"
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) e.preventDefault();
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="equityExpected"
                                label="Equity Expected"
                                rules={[{ required: true, message: "Enter equity expected" }]}
                            >
                                <InputNumber
                                    size="large"
                                    style={{ width: "100%" }}
                                    min={0}
                                    max={100}
                                    placeholder="Enter equity %"
                                    onKeyPress={(e) => {
                                        if (!/[0-9]/.test(e.key)) e.preventDefault();
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="pledgeStartingDate"
                                label="Pledge Start Date"
                                rules={[{ required: true, message: "Select start date" }]}
                            >
                                <DatePicker
                                    size="large"
                                    style={{ width: "100%" }}
                                    disabledDate={(current) => current && current < moment().startOf("day")}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="pledgeClosingDate"
                                label="Pledge Close Date"
                                dependencies={["pledgeStartingDate"]}
                                rules={[
                                    { required: true, message: "Select close date" },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const start = getFieldValue("pledgeStartingDate");
                                            return !value || !start || value.isAfter(start)
                                                ? Promise.resolve()
                                                : Promise.reject(
                                                    new Error("Close date must be after start date")
                                                );
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker
                                    style={{ width: "100%" }}
                                    size="large"
                                    disabledDate={(current) => {
                                        const start = form.getFieldValue("pledgeStartingDate");
                                        return (
                                            current &&
                                            start &&
                                            current.isSameOrBefore(start, "day")
                                        );
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ textAlign: "right", marginTop: 24 }}>
                        <Button type="primary" className="cta-btn" htmlType="submit" loading={saving}>
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
