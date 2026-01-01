// src/pages/EditInvestorProfile.js
import React, { useState, useEffect } from "react";
import moment from 'moment';
import {
  Form,
  Input,
  Typography,
  Row,
  Col,
  Button,
  Spin,
  Alert,
  Upload,
  message,
  Divider,
  DatePicker,
  Select,
} from "antd";
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";


const { Title, Text } = Typography;

const BACKEND = "https://api.925investor.com";

// Dropdown options matching backend enums
const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];
const INVESTOR_TYPE_OPTIONS = [
  { label: "Working Official", value: "WORKING_OFFICIAL" },
  { label: "Company", value: "COMPANY" },
  { label: "Required", value: "REQUIRED" },
  { label: "Student", value: "STUDENT" },
];

// Validation regex patterns
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// Password rules
const PASSWORD_RULES = [
  { test: pw => pw.length >= 8, message: "At least 8 characters" },
  { test: pw => /[A-Z]/.test(pw), message: "At least one uppercase letter" },
  { test: pw => /[a-z]/.test(pw), message: "At least one lowercase letter" },
  { test: pw => /\d/.test(pw), message: "At least one number" },
  { test: pw => /[\W_]/.test(pw), message: "At least one special character" },
];

function normalizeUrl(rawPath) {
  return rawPath ? `${BACKEND}/${rawPath.replace(/\\/g, '/')} ` : null;
}
// Prevent non-numeric for Aadhaar
const preventNonNumeric = e => {
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
};

export default function EditInvestorProfile() {
  const history = useHistory();
  const [form] = Form.useForm();
  const [investor, setInvestor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);



  const pwValue = Form.useWatch("password", form) || "";
  const results = PASSWORD_RULES.map((r) => r.test(pwValue));
  const allPass = results.every(Boolean);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/investor/getInvestor', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      })
      .then(res => {
        if (cancelled) return;
        const dto = res.data['Investor: '];
        setInvestor(dto);
        form.setFieldsValue({
          name: dto.name,
          mobile: dto.mobile,
          dob: dto.dob ? moment(dto.dob, 'YYYY-MM-DD') : null,
          gender: dto.gender,
          type: dto.type,
          aadharNumber: dto.aadharNumber,
          panNumber: dto.panNumber,
          password: dto.password || undefined,
          aadharDoc: dto.aadharDoc ? [{ uid: '-1', name: dto.aadharDoc.split('/').pop(), status: 'done', url: normalizeUrl(dto.aadharDoc) }] : [],
          panDoc: dto.panDoc ? [{ uid: '-1', name: dto.panDoc.split('/').pop(), status: 'done', url: normalizeUrl(dto.panDoc) }] : []
        });
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load investor data.');
        message.error('Could not fetch profile.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [form]);

  const normFile = e => Array.isArray(e) ? e : e && e.fileList;

  const onFinish = async values => {
    setSaving(true);
    const fd = new FormData();
    const payload = {
      id: investor.id,
      name: values.name,
      email: investor.email,
      mobile: values.mobile,
      dob: values.dob.format('YYYY-MM-DD'),
      gender: values.gender,
      type: values.type,
      password: values.password,
      aadhar_number: values.aadharNumber,
      pan_number: values.panNumber,
    };
    fd.append('investorRequestDTO', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    ['aadharDoc', 'panDoc'].forEach(field => {
      const file = values[field]?.[0]?.originFileObj;
      if (file) fd.append(field === 'aadharDoc' ? 'aadhar_doc' : 'pan_doc', file);
    });
    try {
      const { data } = await api.put('/investor/editInvestor', fd, { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });
      if (data.status) { message.success('Profile updated successfully.'); history.push('/investorProfile'); }
      else throw new Error(data.message || 'Update failed');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error while Updating');
      message.error(err.message || 'Update failed');
    } finally { setSaving(false); }
  };

  if (loading) return <Spin tip='Loading profile...' style={{ margin: 40, display: 'block' }} />;
  if (error && !investor) return <Alert type='error' message={error} style={{ margin: 40 }} />;

  return (
    <div style={{ padding: 24, margin: '0 auto' }}>
      {/* <Title level={3}>Edit Investor Profile</Title> */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={3}>Edit Investor Profile</Title>
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
      <Form form={form} layout='vertical' onFinish={onFinish}>

        {/* Name & Email (email displayed from state) */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name='name' label='Full Name' rules={[{ required: true, message: 'Please enter your full name' }]}>
              <Input placeholder='e.g. John Doe' />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label='Email'>
              <Input value={investor.email} disabled />
            </Form.Item>
          </Col>
        </Row>

        {/* Contact & DOB */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name='mobile' label='Mobile Number' rules={[{ required: true, message: 'Please enter contact number' }, { pattern: /^\d{10}$/, message: 'Enter 10-digit phone number' }]}>
              <Input placeholder='10-digit mobile number' maxLength={10} onKeyPress={preventNonNumeric} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name='dob' label='Date of Birth' rules={[{ required: true, message: 'Please select date of birth' }]}>
              <DatePicker size='large' style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        {/* Gender & Investor Type */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name='gender' label='Gender' rules={[{ required: true, message: 'Please select your gender' }]}>
              <Select size="large" placeholder='Select gender' options={GENDER_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name='type' label='Investor Type' rules={[{ required: true, message: 'Please select investor type' }]}>
              <Select size="large" placeholder='Select type' options={INVESTOR_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        {/* Aadhaar & PAN */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name='aadharNumber' label='Aadhaar Number' rules={[{ required: true, message: 'Please enter your Aadhaar number' }, { pattern: AADHAR_REGEX, message: 'Aadhaar must be 12 digits' }]} hasFeedback>
              <Input placeholder='XXXXXXXXXXXX' maxLength={12} onKeyPress={preventNonNumeric} size="small" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name='panNumber' label='PAN Number' normalize={v => (v || '').toUpperCase()} rules={[{ required: true, message: 'Please enter your PAN number' }, { pattern: PAN_REGEX, message: 'PAN format: AAAAA9999A' }]} hasFeedback>
              <Input placeholder='XXXXX9999X' maxLength={10} style={{ textTransform: 'uppercase' }} size="small" />
            </Form.Item>
          </Col>
        </Row>

        {/* Password */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name='password' label='Password'
              rules={[{ required: true, message: 'Please create a password' },
              () => ({ validator(_, v) { const f = PASSWORD_RULES.find(r => !r.test(v || '')); return f ? Promise.reject(f.message) : Promise.resolve(); } })]} hasFeedback validateFirst>
              <Input.Password placeholder='Create a password' size="small" />
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
        <Title level={5}>Upload Documents</Title>
        <Row gutter={[16, 16]}>
          {['aadharDoc', 'panDoc'].map((name, i) => (
            <Col xs={24} sm={12} key={name}>
              <Form.Item label={i === 0 ? 'Aadhaar Card' : 'PAN Card'} name={name} valuePropName='fileList' getValueFromEvent={normFile}>
                <Upload beforeUpload={() => false} maxCount={1} listType='text' accept='.pdf,.jpg,.png' showUploadList={{ showRemoveIcon: false }}>
                  <Button icon={<UploadOutlined />} style={{
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{`Upload ${i === 0 ? 'Aadhaar' : 'PAN'} Card`}</Button>
                </Upload>
              </Form.Item>
            </Col>
          ))}
        </Row>

        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Button type='primary' className="cta-btn" htmlType='submit' loading={saving}>Save Changes</Button>
        </Form.Item>
      </Form>
    </div>
  );
}
