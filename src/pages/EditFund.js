import React, { useState, useEffect } from "react";
import moment from "moment";
import {
    Card,
    Row,
    Col,
    Form,
    Input,
    Select,
    Typography,
    Button,
    DatePicker,
    InputNumber,
    message,
    Upload,
    Spin,
    Divider,
} from "antd";
import { UploadOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory, useParams } from "react-router-dom";
import { api } from "../api";

const { Title, Text } = Typography;
const { Option } = Select;
const BACKEND = "https://api.925investor.com";

// helper to convert raw URL into Upload fileList
function toFileList(rawPath) {
    if (!rawPath) return [];
    const normalized = rawPath.replace(/\\/g, "/");
    return [
        {
            uid: "-1",
            name: normalized.split("/").pop(),
            status: "done",
            url: `${BACKEND}/${normalized}`,
        },
    ];
}

export default function EditFund() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const history = useHistory();
    const { id } = useParams();

    useEffect(() => {
        (async () => {
            try {
                const token = sessionStorage.getItem("token");
                const { data } = await api.get(`/fundDetails/getById/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // pick the right nested object
                const fund = data.fund || data["Funds "] || data;
                // console.log("fetched fund →", fund);

                // populate form
                form.resetFields();
                form.setFieldsValue({
                    proporalName: fund.proporalName,
                    sector: fund.sector,
                    targetedFund: fund.targetedFund,
                    raisedFund: fund.raisedFund,
                    equityToCompany: fund.equityToCompany,
                    equityOffered: fund.equityOffered,
                    valuation: fund.valuation,
                    investmentType: fund.investmentType,
                    numberOfInvestors: fund.numberOfInvestors,
                    fundStartingDate: fund.fundStartingDate
                        ? moment(fund.fundStartingDate)
                        : null,
                    fundClosingDate: fund.fundClosingDate
                        ? moment(fund.fundClosingDate)
                        : null,
                    projectReportDoc: toFileList(fund.projectReport),
                    pitchDoc: toFileList(fund.pitch),
                    companyProfileDoc: toFileList(fund.companyProfile),
                    pitchVideoUrl: toFileList(fund.video),
                });
            } catch (err) {
                console.error(err);
                message.error("Failed to load fund details");
            } finally {
                setLoading(false);
            }
        })();
    }, [id, form]);



    // normalize upload change event
    const normFile = (e) => (Array.isArray(e) ? e : e && e.fileList);

    const onFinish = async (values) => {
        // 1) Build the DTO object exactly as FundDetailsRequestDTO expects:
        const dto = {
            proposalName: values.proporalName,
            sector: values.sector,
            targetedFund: values.targetedFund,
            raisedFund: values.raisedFund,
            equityToCompany: values.equityToCompany,
            equityOffered: values.equityOffered,
            valuation: values.valuation,
            investmentType: values.investmentType,
            numberOfInvestors: values.numberOfInvestors,
            fundStartingDate: values.fundStartingDate
                ? values.fundStartingDate.format("YYYY-MM-DD")
                : null,
            fundClosingDate: values.fundClosingDate
                ? values.fundClosingDate.format("YYYY-MM-DD")
                : null,
        };

        // 2) Create FormData and append your JSON part
        const formData = new FormData();
        formData.append(
            "data",
            new Blob([JSON.stringify(dto)], { type: "application/json" })
        );

        // 3) Helper to pick the File object out of antd’s fileList
        const pickFile = (fileList) =>
            Array.isArray(fileList) && fileList[0] && fileList[0].originFileObj;

        // 4) Append each file if present
        const pr = pickFile(values.projectReportDoc);
        if (pr) formData.append("projectReportDoc", pr);

        const pd = pickFile(values.pitchDoc);
        if (pd) formData.append("pitchDoc", pd);

        const cp = pickFile(values.companyProfileDoc);
        if (cp) formData.append("companyProfile", cp);

        const vid = pickFile(values.pitchVideoUrl);
        if (vid) formData.append("pitchVideo", vid);

        // 5) Send it to your PUT endpoint
        try {
            setSubmitting(true);
            const token = sessionStorage.getItem("token");
            const response = await api.put(
                `/fundDetails/editFundDetails/${id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // NOTE: DO NOT set 'Content-Type' here: let Axios infer the boundary.
                    },
                }
            );
            if (response.data.status) {
                message.success("Fund updated successfully");
                history.push("/fundraising");
            } else {
                message.error(response.data.message || "Update failed");
            }
        } catch (err) {
            console.error(err);
            message.error("Error updating fund details");
        } finally {
            setSubmitting(false);
        }
    };


    if (loading)
        return <Spin tip="Loading fund details..." style={{ display: "block", margin: 40 }} />;

    return (
        <div style={{ padding: 24 }}>
            {/* <Title level={3}>Edit Fundraising</Title> */}
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
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Proposal Name"
                            name="proporalName"
                            rules={[{ required: true, message: 'Please enter a proposal name' }]}
                        >
                            <Input placeholder="Enter proposal name" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Sector"
                            name="sector"
                            rules={[{ required: true, message: 'Please enter a sector' }]}
                        >
                            <Input placeholder="Enter sector" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Targeted Fund (In ₹)"
                            name="targetedFund"
                            rules={[{ required: true, message: 'Enter target fund' }]}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: '100%' }}
                                min={0}
                                placeholder="Enter target fund"
                                onKeyPress={(e) => {
                                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                                }}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Raised Fund (In ₹)"
                            name="raisedFund"
                            dependencies={["targetedFund"]}
                            rules={[
                                { required: true, message: 'Enter raised fund' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const target = getFieldValue('targetedFund');
                                        return value == null || value <= target
                                            ? Promise.resolve()
                                            : Promise.reject(new Error('Raised Fund cannot exceed Targeted Fund'));
                                    },
                                }),
                            ]}
                        >
                            <InputNumber
                                size="large"
                                style={{ width: '100%' }}
                                min={0}
                                placeholder="Enter raised fund"
                                onKeyPress={(e) => {
                                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                                }}
                                onChange={(value) => {
                                    const target = form.getFieldValue('targetedFund');
                                    if (target != null && value > target) {
                                        form.setFieldsValue({ raisedFund: target });
                                    }
                                }}
                            />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Equity to Company (%)"
                            name="equityToCompany"
                            rules={[
                                { required: true, message: 'Enter equity to company' },
                                { type: 'number', max: 100, message: 'Value cannot be more than 100' },
                            ]}
                        >
                            <InputNumber size="large" style={{ width: '100%' }} min={0} max={100} placeholder="Equity to company"
                                onKeyPress={(e) => {
                                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                                }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Equity Offered (%)"
                            name="equityOffered"
                            dependencies={["equityToCompany"]}
                            rules={[
                                { required: true, message: 'Enter equity offered' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const max = getFieldValue('equityToCompany');
                                        return value == null || value <= max
                                            ? Promise.resolve()
                                            : Promise.reject(new Error('Equity Offered must be less than or equal to Equity to Company'));
                                    },
                                }),
                            ]}
                        >
                            <InputNumber size="large" style={{ width: '100%' }} min={0} max={100} placeholder="Equity offered"
                                onKeyPress={(e) => {
                                    if (!/[0-9.]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Valuation" name="valuation">
                            <InputNumber size="large" style={{ width: '100%' }} min={0} placeholder="Enter valuation"
                                onKeyPress={(e) => {
                                    if (!/[0-9.]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Investment Type"
                            name="investmentType"
                            rules={[{ required: true, message: 'Please enter investment type' }]}
                        >
                            <Input placeholder="Enter investment type" />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item label="Number of Investors" name="numberOfInvestors">
                            <InputNumber size="large" style={{ width: '100%' }} min={0} placeholder="Enter number of investors"
                                onKeyPress={(e) => {
                                    if (!/[0-9.]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Fund Starting Date"
                            name="fundStartingDate"
                            rules={[{ required: true, message: 'Please select fund start date' }]}
                        >
                            <DatePicker size="large" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Fund Closing Date"
                            name="fundClosingDate"
                            dependencies={["fundStartingDate"]}
                            rules={[
                                { required: true, message: 'Please select fund closing date' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const startDate = getFieldValue('fundStartingDate');
                                        return !value || value.isAfter(startDate)
                                            ? Promise.resolve()
                                            : Promise.reject(new Error('Fund closing date must be after the start date'));
                                    },
                                }),
                            ]}
                        >
                            <DatePicker
                                size="large"
                                style={{ width: '100%' }}
                                disabledDate={(current) => {
                                    const start = form.getFieldValue('fundStartingDate');
                                    return current && start && current.isSameOrBefore(start, 'day');
                                }}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Divider />
                        <Title level={5} style={{ marginBottom: 12 }}>
                            Fund Documents
                        </Title>
                    </Col>

                    {/* Project Report Upload */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Project Report"
                            name="projectReportDoc"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload
                                beforeUpload={() => false}
                                maxCount={1}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                listType="text"
                                style={{ width: '100%' }}
                                showUploadList={{ showRemoveIcon: false }}
                            >
                                <Button icon={<UploadOutlined />} block size="large" style={{
                                    width: '100%',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>Upload or Replace Report</Button>
                            </Upload>
                        </Form.Item>
                    </Col>

                    {/* Pitch Document Upload */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Pitch Document"
                            name="pitchDoc"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload
                                beforeUpload={() => false}
                                maxCount={1}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                listType="text"
                                style={{ width: '100%' }}
                                showUploadList={{ showRemoveIcon: false }}
                            >
                                <Button icon={<UploadOutlined />} block size="large" style={{
                                    width: '100%',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>Upload or Replace Pitch</Button>
                            </Upload>
                        </Form.Item>
                    </Col>

                    {/* Company Profile Upload */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Company Profile"
                            name="companyProfileDoc"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload
                                beforeUpload={() => false}
                                maxCount={1}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                listType="text"
                                style={{ width: '100%' }}
                                showUploadList={{ showRemoveIcon: false }}
                            >
                                <Button icon={<UploadOutlined />} block size="large" style={{
                                    width: '100%',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>Upload or Replace Profile</Button>
                            </Upload>
                        </Form.Item>
                    </Col>

                    {/* Video Upload */}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Pitch Video"
                            name="pitchVideoUrl"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <Upload
                                beforeUpload={() => false}
                                maxCount={1}
                                accept="video/*"
                                listType="text"
                                style={{ width: '100%' }}
                                showUploadList={{ showRemoveIcon: false }}
                            >
                                <Button icon={<UploadOutlined />} block size="large" style={{
                                    width: '100%',
                                    maxWidth: '100%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>Upload or Replace Video</Button>
                            </Upload>
                        </Form.Item>
                    </Col>
                </Row>

                {/* <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                    <Button type="primary" htmlType="submit" loading={submitting}>
                        Update Fund
                    </Button>
                </div> */}

                <div className="submit-button-wrapper ">
                    <Button type="primary" className="cta-btn" htmlType="submit" loading={submitting}>
                        Update Fund
                    </Button>
                </div>
            </Form>
        </div>
    );
}
