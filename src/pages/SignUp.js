// src/pages/SignUp.js
import React, { useState } from "react";
import { useLocation, Link, useHistory } from "react-router-dom";
import { api } from "../api";                     // your axios instance
import {
  Layout,
  Menu,
  Button,
  Row,
  Col,
  Typography,
  Form,
  Input,
  Select,
  Tabs,
  DatePicker,
  message,
} from "antd";
import moment from "moment";
import signinbg from "../assets/images/sign-up-bg-image.png";
import {
  DribbbleOutlined,
  TwitterOutlined,
  InstagramOutlined,
  GithubOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Header, Footer, Content } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;


const { Text } = Typography;

const PASSWORD_RULES = [
  { test: (pw) => pw.length >= 8, message: "Minimum 8 characters are required" },
  { test: (pw) => /[A-Z]/.test(pw), message: "At least one uppercase letter" },
  { test: (pw) => /[a-z]/.test(pw), message: "At least one lowercase letter" },
  { test: (pw) => /\d/.test(pw), message: "At least one number" },
  { test: (pw) => /[\W_]/.test(pw), message: "At least one special character" },
];

export default function SignUp() {
  const location = useLocation();
  const history = useHistory();
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(false);

  // inside SignUp()
  const session_exp_time = 3 * 60 * 60 * 1000;

  const [form] = Form.useForm();

  const pwValue = Form.useWatch("password", form) || "";
  const results = PASSWORD_RULES.map((r) => r.test(pwValue));
  const allPass = results.every(Boolean);

  const onFinish = async (values) => {
    setLoading(true);

    // 1) Destructure to drop the "confirm" field
    const { confirm, ...rest } = values;

    // 2) If there's a DOB (investor) convert it
    if (rest.dob) {
      rest.dob = rest.dob.format("YYYY-MM-DD");
    }

    // 3) Now "rest" contains everything *except* confirm
    const payload = rest;



    // Choose the right endpoint
    const url =
      activeTab === "business"
        ? "/auth/register"
        : "/auth/registerInvestor";

    try {
      // Call register and destruct the LoginResponse
      const { data } = await api.post(url, payload);
      // data = { token: "...", role: "BUSINESS" | "INVESTOR" }


      // Store token, role, and expiry
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", data.role);
      const expiry = Date.now() + session_exp_time;
      sessionStorage.setItem("tokenExpiry", expiry.toString());

      message.success("Registration successful!");

      // Redirect straight to dashboard
      // history.push("/dashboard");

      // Redirect based on role
      switch (data.role) {
        case "ADMIN":
          history.push("/allInvestments");
          break;
        case "BUSINESS":
          history.push("/businessDashboard");
          break;
        case "INVESTOR":
          history.push("/investorDashboard");
          break;
        default:
          history.push("/sign-in");
      }

      
    } catch (err) {
      console.error("Registration error response:", err.response);
      const resp = err.response;

      if (resp && resp.status === 400) {
        const serverMsg = resp.data?.message || "Bad request";

        // Decide which field to mark
        let fieldName;
        if (activeTab === "business") {
          // business form only has registrationEmail
          fieldName = "registrationEmail";
        } else {
          // investor form has "email" and "mobile"
          if (/email/i.test(serverMsg)) {
            fieldName = "email";
          } else if (/mobile/i.test(serverMsg)) {
            fieldName = "mobile";
          } else {
            fieldName = "email"; // fallback
          }
        }

        // set the inline error on the right Form.Item
        form.setFields([
          {
            name: fieldName,
            errors: [serverMsg],
          },
        ]);
        return; // don’t show the toast
      }

      // everything else
      message.error(
        resp?.data?.message ||
        err.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  const onFinishFailed = (errorInfo) => {
    console.log("Validation failed:", errorInfo);
  };

  return (
    <Layout className="layout-default layout-signin">
      {/* <Header style={{ display: "flex", alignItems: "center", padding: "0 24px" }}>
        <div className="header-col header-nav" style={{ marginLeft: "auto" }}>
          <Menu mode="horizontal" selectedKeys={[location.pathname]} >
            <Menu.Item key="1"><Link to="/sign-in">Sign In</Link></Menu.Item>
            <Menu.Item key="2"><Link to="/sign-up">Sign Up</Link></Menu.Item>
          </Menu>
        </div>
      </Header> */}

      <Content className="signin">
        <Row gutter={[24, 0]} justify="space-around">
          <Col xs={24} lg={{ span: 20, offset: 2 }} md={{ span: 22, offset: 1 }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              centered
              style={{ marginBottom: 24 }}
            >
              <TabPane tab="Register as Business" key="business" />
              <TabPane tab="Register as Investor" key="investor" />
            </Tabs>

            <Row gutter={[24, 0]} justify="space-around">
              {/* ==== Left: the Form ==== */}
              <Col xs={24} lg={{ span: 10, offset: 1 }} md={14}>
                <Title level={3} className="mb-15" style={{ fontSize: 26 }}>
                  {activeTab === "business"
                    ? "Register Your Business"
                    : "Investor Registration"}
                </Title>
                <Title
                  className="font-regular text-muted"
                  level={5}
                  style={{ fontSize: "16px", fontFamily: "Georgia, serif", fontWeight: 400 }}
                >
                  Fill in your details to register
                </Title>

                <Form
                  form={form}
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  layout="vertical"
                  className="row-col"
                  initialValues={{
                    incorporationYear: "",
                    businessType: undefined,
                  }}
                >
                  {activeTab === "business" ? (
                    <>
                      <Form.Item
                        label="Business Name"
                        name="businessName"
                        rules={[{ required: true, message: "Please enter business name" }]}
                      >
                        <Input placeholder="Enter your business name" />
                      </Form.Item>

                      <Form.Item
                        label="Industry Sector"
                        name="industrySector"
                        rules={[
                          { required: true, message: "Please enter industry sector" },
                        ]}
                      >
                        <Input placeholder="e.g., Technology, Healthcare" />
                      </Form.Item>

                      <Form.Item
                        label="Business Type"
                        name="businessType"
                        rules={[
                          { required: true, message: "Please select business type" },
                        ]}
                      >
                        <Select placeholder="Select business type" size="large">
                          <Option value="soleProprietorship">
                            Sole Proprietorship
                          </Option>
                          <Option value="partnership">Partnership</Option>
                          <Option value="privateLimited">Private Limited</Option>
                          <Option value="publicLimited">Public Limited</Option>
                          <Option value="llc">LLC</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Year of Incorporation"
                        name="yearOfIncorporation"
                        rules={[
                          { required: true, message: "Please enter year of incorporation" },
                          { pattern: /^\d{4}$/, message: "Enter a valid 4‑digit year" },
                        ]}
                      >
                        <Input
                          placeholder="YYYY"
                          maxLength={4}
                          inputMode="numeric"        // numeric keyboard on mobiles
                          pattern="[0-9]*"           // validation hint
                          onKeyPress={e => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();    // block non‑digits
                            }
                          }}
                        />
                      </Form.Item>


                      <Form.Item
                        label="Registration Email"
                        name="registrationEmail"
                        rules={[
                          { required: true, message: "Please enter email" },
                          { type: "email", message: "Enter a valid email address" },
                        ]}
                      >
                        <Input placeholder="Enter your business email" />
                      </Form.Item>

                      <Form.Item
                        label="Business URL"
                        name="businessUrl"
                        rules={[
                          {
                            type: "url",
                            message: "Enter a valid URL (https://yourbusiness.com)",
                          },
                        ]}
                      >
                        <Input placeholder="e.g., https://yourbusiness.com" />
                      </Form.Item>

                      <Form.Item
                        label="Contact Number"
                        name="contact"
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
                    </>
                  ) : (
                    <>
                      {/* Investor */}
                      <Form.Item
                        label="Type"
                        name="type"
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Select Type" size="large">
                          <Option value="COMPANY">Company</Option>
                          <Option value="REQUIRED">Required</Option>
                          <Option value="STUDENT">Student</Option>
                          <Option value="WORKING_OFFICIAL">
                            Working Official
                          </Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Name"
                        name="name"
                        rules={[
                          { required: true, message: "Please enter your full name" },
                        ]}
                      >
                        <Input placeholder="Enter your full name" />
                      </Form.Item>

                      <Form.Item
                        label="Date of Birth"
                        name="dob"
                        rules={[
                          { required: true, message: "Please enter your date of birth" },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          style={{ width: "100%" }}
                          placeholder="Select DOB"
                          format="MM/DD/YYYY"
                          disabledDate={(current) =>
                            current && current > moment().endOf("day")
                          }
                        />
                      </Form.Item>

                      <Form.Item
                        label="Gender"
                        name="gender"
                        rules={[{ required: true, message: "Please select gender" }]}
                      >
                        <Select placeholder="Select Gender" size="large">
                          <Option value="Male">Male</Option>
                          <Option value="Female">Female</Option>
                          <Option value="Other">Other</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Mobile Number"
                        name="mobile"
                        rules={[
                          { required: true, message: "Please enter mobile number" },
                          { pattern: /^\d{10}$/, message: "Enter a 10‑digit mobile number" },
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

                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: "Please enter email" },
                          { type: "email", message: "Enter a valid email address" },
                        ]}
                      >
                        <Input placeholder="Enter your email" />
                      </Form.Item>
                    </>
                  )}

                  {/* Common fields */}
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

                  <Form.Item
                    label="Confirm Password"
                    name="confirm"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Please confirm your password" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error("Passwords do not match"));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="Confirm your password" size="small" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" className="cta-btn" htmlType="submit" block loading={loading}>
                      Register
                    </Button>
                  </Form.Item>

                  <p style={{ textAlign: "center" }}>
                    Already have an account?{" "}
                    <Link to="/sign-in" className="text-dark font-bold">
                      Sign In
                    </Link>
                  </p>
                </Form>
              </Col>

              {/* Right: illustration */}
              <Col className="sign-img" style={{ padding: 12 }} xs={24} lg={12} md={12}>
                <img
                  src={signinbg}
                  alt="Sign Up Illustration"
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Content >

      <Footer>
        {/* <Menu mode="horizontal">
          {["Company", "About Us", "Teams", "Products", "Blogs", "Pricing"].map(
            (label) => (
              <Menu.Item key={label}>{label}</Menu.Item>
            )
          )}
        </Menu>
        <Menu mode="horizontal" className="menu-nav-social">
          {[DribbbleOutlined, TwitterOutlined, InstagramOutlined, GithubOutlined].map(
            (Icon, i) => (
              <Menu.Item key={i}>
                <Link to="#">
                  <Icon />
                </Link>
              </Menu.Item>
            )
          )}
        </Menu> */}
        <p className="copyright">
          Copyright © 2025 <a href="#">OneGO</a>.
        </p>
      </Footer>
    </Layout >
  );
}
