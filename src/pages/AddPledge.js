// src/pages/AddPledge.js
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
import { ArrowLeftOutlined } from "@ant-design/icons";
import { api } from "../api";

const { Title } = Typography;

export default function AddPledge() {
    const [form] = Form.useForm();
    const history = useHistory();
    const { fundId } = useParams();
    const investorId = sessionStorage.getItem("investorId");
    const [submitting, setSubmitting] = useState(false);
    const [fundName, setFundName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch fund details to get the name
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token = sessionStorage.getItem("token");
                const resp = await api.get(`/fundDetails/getById/${fundId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // grab the actual “Funds ” object (note the trailing space!)
                const fundWrapper = resp.data["Funds "] || resp.data.Funds || {};
                // and the actual field is “proporalName”
                const name = fundWrapper.proporalName || "";
                if (!cancelled) {
                    setFundName(name);
                    form.setFieldsValue({ fundName: name });
                }
            } catch (e) {
                console.error("Error fetching fund details:", e);
                if (!cancelled) setError("Failed to load fund details");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [fundId, form]);



    const onFinish = async (values) => {
        const payload = {
            fundId: Number(fundId),
            investorId: Number(investorId),
            pledgedAmount: values.pledgedAmount.toString(),
            // numberOfInvestors: values.numberOfInvestors.toString(),
            equityExpected: values.equityExpected.toString(),
            startingDate: values.pledgeStartingDate.format("YYYY-MM-DD"),
            closingDate: values.pledgeClosingDate.format("YYYY-MM-DD"),
        };

        try {
            setSubmitting(true);
            const token = sessionStorage.getItem("token");
            const resp = await api.post(
                "/pledges/addPledge",
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (resp.data.status) {
                message.success("Pledge created successfully!");
                history.push(`/investorFundraising`);
            } else {
                message.error(resp.data.message || "Failed to create pledge");
            }
        } catch {
            message.error("Server error—please try again.");
        } finally {
            setSubmitting(false);
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
                <Title level={3}>Add Pledge</Title>
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
                {/* <Title level={4}>Add Pledge</Title> */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        fundName,
                        pledgedAmount: null,
                        numberOfInvestors: null,
                        equityExpected: null,
                        startingDate: null,
                        closingDate: null,
                    }}
                >
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

                        {/* <Col xs={24} md={12}>
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
                        </Col> */}

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
                                <DatePicker size="large" style={{ width: "100%" }}
                                    disabledDate={(current) => current && current < new Date().setHours(0, 0, 0, 0)} />
                            </Form.Item>
                        </Col>




                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Pledge Close Date"
                                name="pledgeClosingDate"
                                dependencies={['pledgeStartingDate']}
                                rules={[
                                    { required: true, message: 'Please select pledge closing date' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const startDate = getFieldValue('pledgeStartingDate');
                                            if (!value || !startDate || value.isAfter(startDate)) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(
                                                new Error('Pledge closing date must be after the start date')
                                            );
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker size="large"
                                    style={{ width: '100%' }}
                                    disabledDate={(current) => {
                                        const startDate = form.getFieldValue('pledgeStartingDate');
                                        return (
                                            current &&
                                            startDate &&
                                            current.isSameOrBefore(startDate, 'day') // disables same and previous dates
                                        );
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item style={{ textAlign: "right", marginTop: 24 }}>
                        <Button type="primary" className="cta-btn" htmlType="submit" loading={submitting}>
                            Submit Pledge
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
