// src/pages/CreateFundraising.js
import React, { useState } from "react";
import {
  Card,
  Upload,
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
  Divider,
} from "antd";
import { ArrowLeftOutlined, UploadOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";
import "./css/CreateFund.css";

const { Title } = Typography;
const { Option } = Select;

export default function CreateFundraising() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const history = useHistory();

  // This tells Form.Item how to pull the fileList out of Upload’s event
  const normFile = (e) => {
    // e is UploadChangeParam
    // return the array of files
    return e && e.fileList;
  };

  const onFinish = async (values) => {
    // console.log("form values:", values);
    const dto = {
      proposalName: values.proposalName,
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

    const formData = new FormData();
    formData.append(
      "fundDetails",
      new Blob([JSON.stringify(dto)], { type: "application/json" })
    );

    const appendFile = (field) => {
      const fileList = values[field];
      if (fileList && fileList.length) {
        formData.append(field, fileList[0].originFileObj);
      }
    };
    appendFile("projectReportDoc");
    appendFile("pitchDoc");
    appendFile("companyProfileDoc");
    appendFile("pitchVideoUrl");

    try {
      setSubmitting(true);
      const token = sessionStorage.getItem("token");
      const resp = await api.post(
        "/fundDetails/addFundDetails",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT set Content-Type here!
          },
        }
      );

      if (resp.data.status) {
        message.success(resp.data.message);
        form.resetFields();
        history.push("/fundraising");
      } else {
        message.error(resp.data.message || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      message.error("Error submitting fund");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div style={{ padding: 28 }}>
      {/* <Title level={3}>Fundraising Details</Title> */}

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

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 24 }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Proposal Name"
              name="proposalName"
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
              {/* <Select placeholder="Select sector">
                <Option value="Tech">Tech</Option>
                <Option value="Health">Health</Option>
                <Option value="Finance">Finance</Option>
              </Select> */}
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
              dependencies={['targetedFund']}
              rules={[
                { required: true, message: 'Enter raised fund' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const target = getFieldValue('targetedFund');
                    if (value == null || target == null || value <= target) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Raised Fund cannot exceed Targeted Fund'));
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
                {
                  type: 'number',
                  max: 100,
                  message: 'Value cannot be more than 100',
                },
              ]}
            >
              <InputNumber size="large"
                style={{ width: '100%' }}
                min={0}
                max={100}
                placeholder="Equity to company"
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onChange={(value) => {
                  if (value > 100) {
                    form.setFieldsValue({ equityToCompany: 100 });
                  }
                }}
              />
            </Form.Item>

          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Equity Offered (%)"
              name="equityOffered"
              dependencies={['equityToCompany']}
              rules={[
                { required: true, message: 'Enter equity offered' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const max = getFieldValue('equityToCompany');
                    if (value == null || value <= max) return Promise.resolve();
                    return Promise.reject(new Error('Equity Offered must be less than or equal to Equity to Company'));
                  }
                })
              ]}

            >
              <InputNumber size="large"
                style={{ width: '100%' }}
                min={0}
                max={100}
                placeholder="Equity offered"
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Valuation" name="valuation">
              <InputNumber size="large"
                style={{ width: '100%' }}
                min={0}
                placeholder="Enter valuation"
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Investment Type"
              name="investmentType"
              rules={[{ required: true, message: 'Please enter investment type' }]}
            >
              <Input placeholder="Enter investment type" />
              {/* <Select placeholder="Select type">
                <Option value="DEBT">Debt</Option>
                <Option value="EQUITY">Equity</Option>
              </Select> */}
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Number of Investors" name="numberOfInvestors">
              <InputNumber size="large"
                style={{ width: '100%' }}
                min={0}
                placeholder="Enter number of investors"
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Fund Starting Date"
              name="fundStartingDate"
              rules={[{ required: true, message: 'Please select fund start date' }]}
            >
              <DatePicker size="large"
                style={{ width: '100%' }}
              // disabledDate={(current) => current && current < new Date().setHours(0, 0, 0, 0)} // optional: disables past dates
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Fund Closing Date"
              name="fundClosingDate"
              dependencies={['fundStartingDate']}
              rules={[
                { required: true, message: 'Please select fund closing date' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startDate = getFieldValue('fundStartingDate');
                    if (!value || !startDate || value.isAfter(startDate)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Fund closing date must be after the start date')
                    );
                  },
                }),
              ]}
            >
              <DatePicker size="large"
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  const startDate = form.getFieldValue('fundStartingDate');
                  return (
                    current &&
                    startDate &&
                    current.isSameOrBefore(startDate, 'day') // disables same and previous dates
                  );
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
                style={{ display: 'block', width: '100%' }}
                showUploadList={{ showRemoveIcon: false }}
              >
                <Button icon={<UploadOutlined />} style={{
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  Upload Project Report
                </Button>
              </Upload>
            </Form.Item>
          </Col>

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
                style={{ display: 'block', width: '100%' }}
                showUploadList={{ showRemoveIcon: false }}
              >
                <Button icon={<UploadOutlined />} style={{
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  Upload Pitch Document
                </Button>
              </Upload>
            </Form.Item>
          </Col>

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
                style={{ display: 'block', width: '100%' }}
                showUploadList={{ showRemoveIcon: false }}
              >
                <Button icon={<UploadOutlined />} style={{
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  Upload Company Profile
                </Button>
              </Upload>
            </Form.Item>
          </Col>

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
                style={{ display: 'block', width: '100%' }}
                showUploadList={{ showRemoveIcon: false }}
              >
                <Button icon={<UploadOutlined />} style={{
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>Upload Video</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        {/* <Title level={5} style={{ marginTop: 24 }}>Document Uploads</Title>

        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Project Report" name="projectReport">
                <>
                  <Upload
                    beforeUpload={() => false}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    maxCount={1}
                    onChange={(info) => {
                      const file = info.fileList[0]?.originFileObj;
                      if (file) {
                        const url = URL.createObjectURL(file);
                        window.projectReportFile = url;
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                  {window.projectReportFile && (
                    <Button
                      style={{ marginTop: 8 }}
                      onClick={() => window.open(window.projectReportFile, "_blank")}
                    >
                      Preview
                    </Button>
                  )}
                </>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Pitch" name="pitch">
                <>
                  <Upload
                    beforeUpload={() => false}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    maxCount={1}
                    onChange={(info) => {
                      const file = info.fileList[0]?.originFileObj;
                      if (file) {
                        const url = URL.createObjectURL(file);
                        window.pitchFile = url;
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                  {window.pitchFile && (
                    <Button
                      style={{ marginTop: 8 }}
                      onClick={() => window.open(window.pitchFile, "_blank")}
                    >
                      Preview
                    </Button>
                  )}
                </>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Company Profile" name="companyProfile">
                <>
                  <Upload
                    beforeUpload={() => false}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    maxCount={1}
                    onChange={(info) => {
                      const file = info.fileList[0]?.originFileObj;
                      if (file) {
                        const url = URL.createObjectURL(file);
                        window.companyProfileFile = url;
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                  {window.companyProfileFile && (
                    <Button
                      style={{ marginTop: 8 }}
                      onClick={() => window.open(window.companyProfileFile, "_blank")}
                    >
                      Preview
                    </Button>
                  )}
                </>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Video" name="video">
                <>
                  <Upload
                    beforeUpload={() => false}
                    accept="video/mp4"
                    maxCount={1}
                    onChange={(info) => {
                      const file = info.fileList[0]?.originFileObj;
                      if (file) {
                        const url = URL.createObjectURL(file);
                        window.videoFile = url;
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                  {window.videoFile && (
                    <Button
                      style={{ marginTop: 8 }}
                      onClick={() => window.open(window.videoFile, "_blank")}
                    >
                      Preview
                    </Button>
                  )}
                </>
              </Form.Item>
            </Col>
          </Row>
        </Card> */}


        <div className="submit-button-wrapper ">
          <Button type="primary" className="cta-btn" htmlType="submit" loading={submitting}>
            Raise
          </Button>
        </div>

      </Form>
    </div>
  );
}
