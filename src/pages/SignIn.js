// src/pages/SignIn.js
import React, { useState, useRef, useEffect } from "react";
import { useLocation, Link, useHistory } from "react-router-dom";
import { api } from "../api";
import decode from "jwt-decode";
import {
  Layout,
  Menu,
  Button,
  Row,
  Col,
  Typography,
  Form,
  Input,
  Tabs,
} from "antd";
import signinbg from "../assets/images/sign-in-bg-image.png";
import {
  DribbbleOutlined,
  TwitterOutlined,
  InstagramOutlined,
  GithubOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Header, Footer, Content } = Layout;
const { TabPane } = Tabs;

export default function SignIn() {
  // ── mounted flag to avoid setState after unmount ───────────────────────────
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const location = useLocation();
  const history = useHistory();
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(false);

  const [loginError, setLoginError] = useState(null);

  // ── submit handler ────────────────────────────────────────────────────────
  const onFinish = async (values) => {
    if (!isMounted.current) return;
    setLoading(true);
    setLoginError(null);

    const payload =
      activeTab === "business"
        ? { email: values.businessEmail, password: values.businessPassword }
        : { email: values.investorEmail, password: values.investorPassword };

    // 3 hours in milliseconds
    const session_exp_time = 3 * 60 * 60 * 1000;

    try {
      const { data } = await api.post("/auth/login", payload);
      if (!isMounted.current) return;

      // Store token, role, expiry
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", data.role);
      const expiryTime = Date.now() + session_exp_time;
      sessionStorage.setItem("tokenExpiry", expiryTime.toString());

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
      if (isMounted.current) {
        console.error("Login failed", err);
        setLoginError("Invalid email or password. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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
              <TabPane tab="Login as Business" key="business" />
              <TabPane tab="Login as Investor" key="investor" />
            </Tabs>

            <Row gutter={[24, 0]} justify="space-around">
              {/* ==== Left: the Form ==== */}
              <Col xs={24} lg={{ span: 10, offset: 1 }} md={14}>
                <Title className="mb-15" style={{ fontSize: 26 }}>
                  {activeTab === "business" ? "Business Login" : "Investor Login"}
                </Title>
                <Title level={5} className="font-regular text-muted" style={{ fontSize: 16, fontFamily: "Georgia, serif", fontWeight: 400 }}>
                  Enter your credentials to sign in
                </Title>

                <Form
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  layout="vertical"
                  className="row-col"
                >
                  {activeTab === "business" ? (
                    <>
                      <Form.Item
                        label="Business Email"
                        name="businessEmail"
                        rules={[
                          { required: true, type: "email", message: "Enter valid business email" },
                        ]}
                      >
                        <Input placeholder="Business Email" />
                      </Form.Item>
                      <Form.Item
                        label="Password"
                        name="businessPassword"
                        rules={[{ required: true, message: "Enter password" }]}
                      >
                        <Input.Password placeholder="Password" size="small" />
                      </Form.Item>
                    </>
                  ) : (
                    <>
                      <Form.Item
                        label="Investor Email"
                        name="investorEmail"
                        rules={[
                          { required: true, type: "email", message: "Enter valid email" },
                        ]}
                      >
                        <Input placeholder="Email" />
                      </Form.Item>
                      <Form.Item
                        label="Password"
                        name="investorPassword"
                        rules={[{ required: true, message: "Enter password" }]}
                      >
                        <Input.Password placeholder="Password" size="small" />
                      </Form.Item>
                    </>
                  )}

                  {loginError && (
                    <div style={{ color: "red", marginBottom: 12, textAlign: "center" }}>
                      {loginError}
                    </div>
                  )}

                  <Form.Item>
                    <Button type="primary" className="cta-btn" htmlType="submit" block loading={loading}>
                      Sign In
                    </Button>
                  </Form.Item>

                  <p style={{ textAlign: "center" }}>
                    Don't have an account?{" "}
                    <Link to="/sign-up" className="text-dark font-bold">Sign Up</Link>
                  </p>
                </Form>
              </Col>

              {/* ==== Right: the Illustration ==== */}
              <Col className="sign-img" style={{ padding: 12 }} xs={24} lg={12} md={12}>
                <img
                  src={signinbg}
                  alt="Sign In Illustration"
                  style={{ width: "100%" }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Content>

      <Footer>
        {/* <Menu
          mode="horizontal"
          items={["Company", "About Us", "Teams", "Products", "Blogs", "Pricing"].map(label => ({
            key: label, label
          }))}
        />
        <Menu
          mode="horizontal"
          className="menu-nav-social"
          items={[DribbbleOutlined, TwitterOutlined, InstagramOutlined, GithubOutlined].map((Icon, i) => ({
            key: i,
            label: <Link to="#"><Icon /></Link>
          }))}
        /> */}
        <p className="copyright">
          Copyright © 2025 <a href="#">OneGO</a>.
        </p>
      </Footer>
    </Layout>
  );
}
