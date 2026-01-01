// src/pages/AddInvestment.js
import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Row,
  Col,
  Input,
  InputNumber,
  Button,
  Typography,
  message,
  Spin,
  Alert,
  Modal,
  DatePicker,
} from "antd";
import { ExclamationCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory, useParams } from "react-router-dom";
import moment from "moment";
import { api } from "../api";

const { Title } = Typography;

export default function AddInvestment() {
  const [form] = Form.useForm();
  const history = useHistory();
  const { pledgeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Hidden state values
  const [investorId, setInvestorId] = useState(null);
  const [fundId, setFundId] = useState(null);
  const [fundName, setFundName] = useState("");

  // Fetch pledge to grab investorId, fundId, fundName
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = sessionStorage.getItem("token");
        const resp = await api.get(`/pledges/getPledgeById/${pledgeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dto = resp.data["Pledges: "];
        if (!cancelled && dto) {
          const invId = dto.investor?.id ?? null;
          const fId = dto.fundDetails?.id ?? null;
          const fName = dto.fundDetails?.proporalName || "";

          setInvestorId(invId);
          setFundId(fId);
          setFundName(fName);

          form.setFieldsValue({
            fundName: fName,
            mileStoneReached: dto.mileStoneReached || "",
            investedAmount: dto.investedAmount ? Number(dto.investedAmount) : null,
            totalPeriod: dto.totalPeriod ?? null,
            // Do NOT prepopulate starting/closing dates from pledge — user requested these to be added freshly
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

  // Actual network submit — returns a Promise so Modal.confirm can await it
  const submitInvestment = async (values) => {
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem("token");
      const payload = {
        investorId,
        fundId,
        mileStoneReached: values.mileStoneReached,
        investedAmount: values.investedAmount.toString(),
        totalPeriod: values.totalPeriod,
        startingDate: values.startingDate ? values.startingDate.format("YYYY-MM-DD") : null,
        closingDate: values.closingDate ? values.closingDate.format("YYYY-MM-DD") : null,
      };
      const resp = await api.post("/investments/addInvestment", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.data.status) {
        message.success("Investment added successfully!");
        history.push(`/fundPledges/${fundId}`);
      } else {
        message.error(resp.data.message || "Failed to add investment");
      }
    } catch (e) {
      console.error(e);
      message.error("Server error—please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // onFinish now shows confirmation dialog. Only if user confirms do we call submitInvestment.
  const onFinish = (values) => {
    Modal.confirm({
      title: "Confirm submission",
      icon: <ExclamationCircleOutlined />,
      content:
        "After submission you can not modify the handshake. Do you want to submit now?",
      okText: "OK",
      cancelText: "Cancel",
      // Return the promise from submitInvestment so modal shows loading while request runs
      onOk: () => submitInvestment(values),
    });
  };

  if (loading) return <Spin style={{ margin: 40, display: "block" }} />;
  if (error) return <Alert type="error" message={error} style={{ margin: 24 }} />;

  // Helper for disabledDate logic
  const todayStart = moment().startOf("day");

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
        <Title level={3}>Add Investment</Title>
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
          }}
          icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#fff" }} />}
        />
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            mileStoneReached: "",
            investedAmount: null,
            totalPeriod: null,
          }}
        >
          <Row gutter={16}>
            {/* Read-only Fund Name */}
            <Col xs={24} md={12}>
              <Form.Item label="Fund Name" name="fundName">
                <Input disabled />
              </Form.Item>
            </Col>

            {/* Milestone */}
            <Col xs={24} md={12}>
              <Form.Item
                name="mileStoneReached"
                label="Milestone Reached"
                rules={[{ required: true, message: "Enter milestone reached" }]}
              >
                <Input placeholder="Milestone 1" />
              </Form.Item>
            </Col>

            {/* Invested Amount */}
            <Col xs={24} md={12}>
              <Form.Item
                name="investedAmount"
                label="Invested Amount (In ₹)"
                rules={[{ required: true, message: "Enter invested amount" }]}
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

            {/* Total Period */}
            <Col xs={24} md={12}>
              <Form.Item
                name="totalPeriod"
                label="Total Period (months)"
                rules={[{ required: true, message: "Enter total period" }]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="Enter period in months"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) e.preventDefault();
                  }}
                />
              </Form.Item>
            </Col>

            {/* Starting Date */}
            <Col xs={24} md={12}>
              <Form.Item
                name="startingDate"
                label="Start Date"
                rules={[
                  { required: true, message: "Select start date" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (value.isBefore(todayStart, "day")) {
                        return Promise.reject(new Error("Start date cannot be before today"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  disabledDate={(current) => current && current.isBefore(todayStart, "day")}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>

            {/* Closing Date */}
            <Col xs={24} md={12}>
              <Form.Item
                name="closingDate"
                label="Closing Date"
                dependencies={["startingDate"]}
                rules={[
                  { required: true, message: "Select closing date" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const start = getFieldValue("startingDate");
                      if (!value || !start) return Promise.resolve();
                      if (value.isSameOrBefore(start, "day")) {
                        return Promise.reject(new Error("Closing date must be after start date"));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  disabledDate={(current) => {
                    const start = form.getFieldValue("startingDate");
                    if (start && moment.isMoment(start)) {
                      // disable same day and earlier
                      return current && current.isSameOrBefore(start, "day");
                    }
                    // if start not chosen yet, don't allow dates before today
                    return current && current.isBefore(todayStart, "day");
                  }}
                />
              </Form.Item>
            </Col>

          </Row>

          <Form.Item style={{ textAlign: "right", marginTop: 24 }}>
            <Button type="primary" className="cta-btn" htmlType="submit" loading={submitting}>
              Handshake
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
