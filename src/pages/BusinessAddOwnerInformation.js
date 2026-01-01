// src/pages/CreateOwnerInformation.js
import React, { useState } from "react";
import {
  Row,
  Col,
  Form,
  Input,
  Button,
  Upload,
  Typography,
  message,
  Divider,
} from "antd";
import { UploadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";

const { Title } = Typography;

// Validation regex patterns
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// Prevent non-numeric for Aadhaar
const preventNonNumeric = e => {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
};

export default function CreateOwnerInformation() {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const history = useHistory();

  // normalize file list helper
  const normFile = (e) => (Array.isArray(e) ? e : e && e.fileList);

  const onFinish = async (values) => {
    setSaving(true);
    const fd = new FormData();

    // build JSON blob
    const dto = {
      ownerName: values.ownerName,
      ownerPanNumber: values.ownerPanNumber,
      dinNumber: values.dinNumber,
      ownerEmail: values.ownerEmail,
      ownerContact: values.ownerContact,
      ownerAadharNumber: values.ownerAadharNumber,
    };
    fd.append(
      "ownersRequestDTO",
      new Blob([JSON.stringify(dto)], { type: "application/json" })
    );

    // append files if provided
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
      const { data } = await api.post("/owners/addOwners", fd, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });
      if (data.status) {
        message.success("Owner created successfully");
        history.push("/businessOwnersList");
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "Creation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>

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
      {/* <Title level={3}>Add New Owner</Title> */}
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

          {/* DIN / PIN */}
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
              <Input placeholder="Enter email address" />
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
              rules={[{ required: true, message: "Please upload PAN document" }]}
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
              rules={[{ required: true, message: "Please upload front side" }]}
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
              rules={[{ required: true, message: "Please upload back side" }]}
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
                Add Owner
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
